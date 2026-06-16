package com.cecarhub.admin.dto;

public record MetricsResponse(
        long totalUsers,
        long bannedUsers,
        long activeSessions,
        long totalListings,
        long blockedListings
) {}
