package com.cecarhub.admin.dto;

import java.time.Instant;
import java.util.List;

public record ActivityResponse(
        List<UserActivity> recentUsers,
        List<SessionActivity> recentSessions
) {

    public record UserActivity(
            String id,
            String name,
            String email,
            String role,
            Boolean banned,
            Instant createdAt
    ) {}

    public record SessionActivity(
            String id,
            String userId,
            String ipAddress,
            Instant createdAt,
            Instant expiresAt
    ) {}
}
