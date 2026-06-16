package com.cecarhub.admin.dto;

import java.time.Instant;

public record UserResponse(
        String id,
        String name,
        String email,
        String role,
        Boolean emailVerified,
        String image,
        Boolean banned,
        Instant createdAt,
        Instant updatedAt
) {}
