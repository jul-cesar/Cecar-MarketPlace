package com.cecarhub.admin.repository;

import com.cecarhub.admin.domain.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;

public interface SessionRepository extends JpaRepository<Session, String> {

    @Query("SELECT COUNT(s) FROM Session s WHERE s.expiresAt > :now")
    long countActiveSessions(Instant now);
}
