package com.cecar.marketplace.filter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 2)
public class EmailDomainFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(EmailDomainFilter.class);
    private static final String ALLOWED_DOMAIN = "@cecar.edu.co";
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        if (!"POST".equals(method) || !isAuthEndpoint(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
        byte[] body = wrappedRequest.getContentAsByteArray();

        if (body.length > 0) {
            String bodyStr = new String(body, StandardCharsets.UTF_8);
            try {
                JsonNode node = objectMapper.readTree(bodyStr);
                String email = node.has("email") ? node.get("email").asText(null) : null;

                if (email != null && !email.isBlank() && !email.endsWith(ALLOWED_DOMAIN)) {
                    log.warn("[Gateway] {} {} -> 403 Rejected email domain: {}", method, path, email);
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
                    response.getWriter().write("""
                            {"type":"forbidden","title":"Forbidden","status":403,"detail":"Solo se permiten correos institucionales (@cecar.edu.co)"}
                            """);
                    return;
                }
            } catch (Exception e) {
                log.debug("[Gateway] Could not parse auth request body: {}", e.getMessage());
            }
        }

        filterChain.doFilter(wrappedRequest, response);
    }

    private boolean isAuthEndpoint(String path) {
        return path.startsWith("/api/v1/identity/auth/sign-up") ||
                path.startsWith("/api/v1/identity/auth/sign-in");
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return HttpMethod.OPTIONS.matches(request.getMethod());
    }
}
