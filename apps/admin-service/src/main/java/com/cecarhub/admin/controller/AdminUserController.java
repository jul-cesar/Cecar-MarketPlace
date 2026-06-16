package com.cecarhub.admin.controller;

import com.cecarhub.admin.dto.BanRequest;
import com.cecarhub.admin.dto.UserResponse;
import com.cecarhub.admin.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
public class AdminUserController {

    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public Page<UserResponse> findAll(
            @RequestParam(required = false) Boolean banned,
            Pageable pageable
    ) {
        if (banned != null) {
            return userService.findByBanned(banned, pageable);
        }
        return userService.findAll(pageable);
    }

    @GetMapping("/{id}")
    public UserResponse findById(@PathVariable String id) {
        return userService.findById(id);
    }

    @PatchMapping("/{id}/ban")
    public UserResponse banUser(@PathVariable String id) {
        return userService.banUser(id);
    }

    @PatchMapping("/{id}/unban")
    public UserResponse unbanUser(@PathVariable String id) {
        return userService.unbanUser(id);
    }

    @GetMapping("/recent")
    public List<UserResponse> findRecent() {
        return userService.findRecent();
    }
}
