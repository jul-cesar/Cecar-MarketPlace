package com.cecarhub.admin.dto;

import jakarta.validation.constraints.NotNull;

public record BanRequest(
        @NotNull Boolean banned,
        String reason
) {}
