package com.cecar.marketplace_catalog.dto.listing;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import com.cecar.marketplace_catalog.domain.ListingCondition;
import com.cecar.marketplace_catalog.domain.ListingStatus;
import com.cecar.marketplace_catalog.domain.ListingType;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

public record UpdateListingRequest(
        @Size(max = 200)
        String title,

        String description,

        @DecimalMin(value = "0.00")
        BigDecimal price,

        ListingType listingType,

        ListingCondition condition,

        ListingStatus status,

        @Size(max = 255)
        String location,

        Map<String, String> contactInfo,

        Set<UUID> categoryIds,

        @Size(max = 5)
        List<CreateListingImageRequest> images
) {
}
