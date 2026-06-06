package com.cecar.marketplace_catalog.dto.listing;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateListingImageRequest(
        @NotBlank
        String url,

        @NotBlank
        @Size(max = 255)
        String name,

        @NotBlank
        @Size(max = 500)
        String key
) {
}
