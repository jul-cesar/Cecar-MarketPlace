package com.cecarhub.admin.service;

import com.cecarhub.admin.domain.User;
import com.cecarhub.admin.dto.UserResponse;
import com.cecarhub.admin.exception.ResourceNotFoundException;
import com.cecarhub.admin.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> findAll(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> findByBanned(Boolean banned, Pageable pageable) {
        return userRepository.findByBanned(banned, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public UserResponse findById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        return toResponse(user);
    }

    @Transactional
    public UserResponse banUser(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        user.setBanned(true);
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse unbanUser(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        user.setBanned(false);
        return toResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> findRecent() {
        return userRepository.findTop10ByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getEmailVerified(),
                user.getImage(),
                user.getBanned(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
