package com.cecar.marketplace_catalog.dto.category;

import java.time.Instant;
import java.util.UUID;

public record CategoryResponse(
        UUID id,
        String name,
        String slug,
        String icon,
        Instant createdAt,
        Instant updatedAt
) {
}
