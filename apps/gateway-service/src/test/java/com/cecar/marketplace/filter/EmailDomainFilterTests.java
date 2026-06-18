package com.cecar.marketplace.filter;

import jakarta.servlet.ServletException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;

class EmailDomainFilterTests {

    private final EmailDomainFilter filter = new EmailDomainFilter();

    @Test
    void shouldRejectNonInstitutionalEmail() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/identity/auth/sign-up/email");
        request.setContentType("application/json");
        request.setContent("{".concat("\"email\":\"user@gmail.com\"}").getBytes(StandardCharsets.UTF_8));
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertEquals(403, response.getStatus());
    }

    @Test
    void shouldAllowInstitutionalEmail() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/identity/auth/sign-up/email");
        request.setContentType("application/json");
        request.setContent("{".concat("\"email\":\"user@cecar.edu.co\"}").getBytes(StandardCharsets.UTF_8));
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertEquals(200, response.getStatus());
        assertEquals(request.getRequestURI(), chain.getRequest().getRequestURI());
    }
}
