package com.cecarhub.admin.service;

import com.cecarhub.admin.dto.ListingResponse;
import com.cecarhub.admin.exception.ExternalServiceException;
import com.cecarhub.admin.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class CatalogClient {

    private static final Logger log = LoggerFactory.getLogger(CatalogClient.class);

    private final RestClient catalogRestClient;

    public CatalogClient(RestClient catalogRestClient) {
        this.catalogRestClient = catalogRestClient;
    }

    public Page<ListingResponse> getAllListings(Pageable pageable) {
        try {
            var response = catalogRestClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/admin/listings")
                            .queryParam("page", pageable.getPageNumber())
                            .queryParam("size", pageable.getPageSize())
                            .queryParam("sort", convertSort(pageable))
                            .build())
                    .retrieve()
                    .body(new PagedListingResponse());
            return toPage(response, pageable);
        } catch (Exception e) {
            log.error("Error fetching listings from catalog: {}", e.getMessage());
            throw new ExternalServiceException("Failed to fetch listings from catalog service");
        }
    }

    public Page<ListingResponse> getListingsByStatus(String status, Pageable pageable) {
        try {
            var response = catalogRestClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/admin/listings")
                            .queryParam("status", status)
                            .queryParam("page", pageable.getPageNumber())
                            .queryParam("size", pageable.getPageSize())
                            .queryParam("sort", convertSort(pageable))
                            .build())
                    .retrieve()
                    .body(new PagedListingResponse());
            return toPage(response, pageable);
        } catch (Exception e) {
            log.error("Error fetching listings by status from catalog: {}", e.getMessage());
            throw new ExternalServiceException("Failed to fetch listings from catalog service");
        }
    }

    public ListingResponse updateListingStatus(String listingId, String status) {
        try {
            return catalogRestClient.patch()
                    .uri("/admin/listings/{id}/status", listingId)
                    .body(Map.of("status", status))
                    .retrieve()
                    .body(ListingResponse.class);
        } catch (org.springframework.web.client.HttpClientErrorException.NotFound e) {
            throw new ResourceNotFoundException("Listing not found: " + listingId);
        } catch (Exception e) {
            log.error("Error updating listing status: {}", e.getMessage());
            throw new ExternalServiceException("Failed to update listing status");
        }
    }

    public Map<String, Object> getListingStats() {
        try {
            return catalogRestClient.get()
                    .uri("/admin/listings/stats")
                    .retrieve()
                    .body(new ParameterizedTypeReference<>() {});
        } catch (Exception e) {
            log.error("Error fetching listing stats: {}", e.getMessage());
            throw new ExternalServiceException("Failed to fetch listing stats");
        }
    }

    private String convertSort(Pageable pageable) {
        if (pageable.getSort().isEmpty()) {
            return "createdAt,desc";
        }
        var order = pageable.getSort().iterator().next();
        return order.getProperty() + "," + order.getDirection().name().toLowerCase();
    }

    private Page<ListingResponse> toPage(PagedListingResponse response, Pageable pageable) {
        if (response == null) {
            return Page.empty(pageable);
        }
        return new PageImpl<>(response.content(), pageable, response.totalElements());
    }

    @SuppressWarnings("unused")
    private record PagedListingResponse(
            List<ListingResponse> content,
            int totalPages,
            long totalElements,
            boolean last,
            int size,
            int number
    ) {}
}
