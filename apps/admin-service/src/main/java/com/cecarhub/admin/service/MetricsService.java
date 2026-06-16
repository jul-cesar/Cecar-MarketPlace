package com.cecarhub.admin.service;

import com.cecarhub.admin.dto.ActivityResponse;
import com.cecarhub.admin.repository.SessionRepository;
import com.cecarhub.admin.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class MetricsService {

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;

    public MetricsService(UserRepository userRepository, SessionRepository sessionRepository) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
    }

    @Transactional(readOnly = true)
    public long getTotalUsers() {
        return userRepository.count();
    }

    @Transactional(readOnly = true)
    public long getBannedUsers() {
        return userRepository.countByBanned(true);
    }

    @Transactional(readOnly = true)
    public long getActiveSessions() {
        return sessionRepository.countActiveSessions(Instant.now());
    }

    @Transactional(readOnly = true)
    public ActivityResponse getRecentActivity() {
        var recentUsers = userRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .map(u -> new ActivityResponse.UserActivity(
                        u.getId(), u.getName(), u.getEmail(),
                        u.getRole(), u.getBanned(), u.getCreatedAt()
                ))
                .toList();

        var recentSessions = sessionRepository.findAll(
                        PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent().stream()
                .map(s -> new ActivityResponse.SessionActivity(
                        s.getId(), s.getUserId(), s.getIpAddress(),
                        s.getCreatedAt(), s.getExpiresAt()
                ))
                .toList();

        return new ActivityResponse(recentUsers, recentSessions);
    }
}
