package com.cecar.marketplace_catalog.dto.listingImage;

import java.time.Instant;
import java.util.UUID;

public record ListingImageResponse(
        UUID id,
        String url,
        String name,
        String key,
        Integer sortOrder,
        Instant createdAt
) {
}
