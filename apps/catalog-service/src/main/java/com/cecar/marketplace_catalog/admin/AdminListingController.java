package com.cecar.marketplace_catalog.admin;

import com.cecar.marketplace_catalog.domain.ListingStatus;
import com.cecar.marketplace_catalog.dto.listing.ListingDetailResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin/listings")
public class AdminListingController {

    private final AdminListingService adminListingService;

    public AdminListingController(AdminListingService adminListingService) {
        this.adminListingService = adminListingService;
    }

    @GetMapping
    public Page<ListingDetailResponse> findAll(
            @RequestParam(required = false) ListingStatus status,
            Pageable pageable
    ) {
        if (status != null) {
            return adminListingService.findByStatus(status, pageable);
        }
        return adminListingService.findAll(pageable);
    }

    @PatchMapping("/{id}/status")
    public ListingDetailResponse updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body
    ) {
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            throw new com.cecar.marketplace_catalog.exception.BadRequestException("status is required");
        }
        return adminListingService.updateStatus(id, status);
    }

    @GetMapping("/stats")
    public Map<String, Long> getStats() {
        return adminListingService.getStats();
    }
}
