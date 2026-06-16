package com.cecarhub.admin.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateListingStatusRequest(
        @NotBlank String status
) {}
