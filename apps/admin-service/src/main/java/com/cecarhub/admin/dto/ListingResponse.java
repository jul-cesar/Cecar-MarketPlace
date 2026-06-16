package com.cecarhub.admin.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record ListingResponse(
        UUID id,
        String sellerId,
        String title,
        String description,
        BigDecimal price,
        String listingType,
        String condition,
        String status,
        String location,
        Map<String, String> contactInfo,
        Integer viewCount,
        Instant createdAt,
        Instant updatedAt
) {}
