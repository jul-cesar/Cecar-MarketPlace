package com.cecar.marketplace_catalog.dto.listing;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.cecar.marketplace_catalog.domain.ListingCondition;
import com.cecar.marketplace_catalog.domain.ListingStatus;
import com.cecar.marketplace_catalog.domain.ListingType;
import com.cecar.marketplace_catalog.dto.category.CategoryResponse;
import com.cecar.marketplace_catalog.dto.listingImage.ListingImageResponse;

public record ListingSummaryResponse(
        UUID id,
        String sellerId,
        String title,
        String description,
        BigDecimal price,
        ListingType listingType,
        ListingCondition condition,
        ListingStatus status,
        String location,
        Integer viewCount,
        String coverImageUrl,
        List<CategoryResponse> categories,
        List<ListingImageResponse> images,
        Instant createdAt,
        Instant updatedAt
) {
}
