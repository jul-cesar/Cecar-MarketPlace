package com.cecarhub.admin.config;

import jakarta.servlet.ServletException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AdminAuthFilterTests {

    private final AdminAuthFilter filter = new AdminAuthFilter();

    @Test
    void shouldReturnUnauthorizedWhenUserHeadersAreMissing() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/users");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertEquals(401, response.getStatus());
    }

    @Test
    void shouldAllowAdminRoleIgnoringCase() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/users");
        request.addHeader("X-User-Id", "user-1");
        request.addHeader("X-User-Role", "admin");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertEquals(200, response.getStatus());
        assertEquals(request, chain.getRequest());
    }

    @Test
    void shouldReturnForbiddenForNonAdminRole() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/users");
        request.addHeader("X-User-Id", "user-1");
        request.addHeader("X-User-Role", "user");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertEquals(403, response.getStatus());
    }
}
