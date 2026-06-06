package com.cecar.marketplace_catalog.dto.listing;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import com.cecar.marketplace_catalog.domain.ListingCondition;
import com.cecar.marketplace_catalog.domain.ListingType;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateListingRequest(
        @NotBlank
        @Size(max = 200)
        String title,

        @NotBlank
        String description,

        @DecimalMin(value = "0.00")
        BigDecimal price,

        @NotNull
        ListingType listingType,

        ListingCondition condition,

        @Size(max = 255)
        String location,

        Map<String, String> contactInfo,

        @NotEmpty
        Set<UUID> categoryIds,

        @Size(max = 5)
        List<CreateListingImageRequest> images
) {
}
