package com.cecarhub.admin.controller;

import com.cecarhub.admin.dto.ListingResponse;
import com.cecarhub.admin.dto.UpdateListingStatusRequest;
import com.cecarhub.admin.service.CatalogClient;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/listings")
public class AdminListingController {

    private final CatalogClient catalogClient;

    public AdminListingController(CatalogClient catalogClient) {
        this.catalogClient = catalogClient;
    }

    @GetMapping
    public Page<ListingResponse> findAll(
            @RequestParam(required = false) String status,
            Pageable pageable
    ) {
        if (status != null && !status.isBlank()) {
            return catalogClient.getListingsByStatus(status, pageable);
        }
        return catalogClient.getAllListings(pageable);
    }

    @PatchMapping("/{id}/block")
    public ListingResponse blockListing(@PathVariable String id) {
        return catalogClient.updateListingStatus(id, "BLOCKED");
    }

    @PatchMapping("/{id}/restore")
    public ListingResponse restoreListing(@PathVariable String id) {
        return catalogClient.updateListingStatus(id, "ACTIVE");
    }

    @PatchMapping("/{id}/status")
    public ListingResponse updateStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateListingStatusRequest request
    ) {
        return catalogClient.updateListingStatus(id, request.status());
    }
}
