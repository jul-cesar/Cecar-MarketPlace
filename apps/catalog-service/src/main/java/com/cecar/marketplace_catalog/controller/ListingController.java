package com.cecar.marketplace_catalog.controller;

import com.cecar.marketplace_catalog.dto.listing.CreateListingRequest;
import com.cecar.marketplace_catalog.dto.listing.ListingDetailResponse;
import com.cecar.marketplace_catalog.dto.listing.ListingSummaryResponse;
import com.cecar.marketplace_catalog.dto.listing.UpdateListingRequest;
import com.cecar.marketplace_catalog.service.ListingService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/listings")
public class ListingController {

    private final ListingService listingService;

    public ListingController(ListingService listingService) {
        this.listingService = listingService;
    }

    @GetMapping
    public Page<ListingSummaryResponse> findActive(Pageable pageable) {
        return listingService.findActive(pageable);
    }

    @GetMapping("/{id}")
    public ListingDetailResponse findById(@PathVariable UUID id) {
        return listingService.findById(id);
    }

    @GetMapping("/me")
    public Page<ListingSummaryResponse> findMine(
            @RequestHeader("X-User-Id") String sellerId,
            Pageable pageable
    ) {
        return listingService.findBySeller(sellerId, pageable);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ListingDetailResponse create(
            @RequestHeader("X-User-Id") String sellerId,
            @Valid @RequestBody CreateListingRequest request
    ) {
        return listingService.create(request, sellerId);
    }

    @PutMapping("/{id}")
    public ListingDetailResponse update(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") String sellerId,
            @Valid @RequestBody UpdateListingRequest request
    ) {
        return listingService.update(id, request, sellerId);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") String sellerId
    ) {
        listingService.remove(id, sellerId);
    }
}
