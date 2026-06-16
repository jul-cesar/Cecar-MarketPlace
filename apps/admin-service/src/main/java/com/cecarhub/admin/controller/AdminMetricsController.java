package com.cecarhub.admin.controller;

import com.cecarhub.admin.dto.MetricsResponse;
import com.cecarhub.admin.service.CatalogClient;
import com.cecarhub.admin.service.MetricsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/metrics")
public class AdminMetricsController {

    private final MetricsService metricsService;
    private final CatalogClient catalogClient;

    public AdminMetricsController(MetricsService metricsService, CatalogClient catalogClient) {
        this.metricsService = metricsService;
        this.catalogClient = catalogClient;
    }

    @GetMapping
    public MetricsResponse getMetrics() {
        long totalUsers = metricsService.getTotalUsers();
        long bannedUsers = metricsService.getBannedUsers();
        long activeSessions = metricsService.getActiveSessions();

        Map<String, Object> listingStats = catalogClient.getListingStats();
        long totalListings = listingStats.get("total") != null
                ? ((Number) listingStats.get("total")).longValue() : 0;
        long blockedListings = listingStats.get("blocked") != null
                ? ((Number) listingStats.get("blocked")).longValue() : 0;

        return new MetricsResponse(totalUsers, bannedUsers, activeSessions, totalListings, blockedListings);
    }

    @GetMapping("/listings")
    public Map<String, Object> getListingStats() {
        return catalogClient.getListingStats();
    }
}
