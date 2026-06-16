package com.cecarhub.admin.controller;

import com.cecarhub.admin.dto.ActivityResponse;
import com.cecarhub.admin.service.MetricsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/reports")
public class AdminReportController {

    private final MetricsService metricsService;

    public AdminReportController(MetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @GetMapping("/activity")
    public ActivityResponse getRecentActivity() {
        return metricsService.getRecentActivity();
    }
}
