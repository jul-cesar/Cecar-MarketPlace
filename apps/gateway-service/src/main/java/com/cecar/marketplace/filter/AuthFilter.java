package com.cecar.marketplace.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.*;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class AuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(AuthFilter.class);

    private final RestClient restClient;
    private final String identityServiceUrl;

    public AuthFilter(@Value("${identity-service.url:http://localhost:3000}") String identityServiceUrl) {
        this.identityServiceUrl = identityServiceUrl;
        this.restClient = RestClient.builder()
                .baseUrl(identityServiceUrl)
                .build();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();
        String origin = request.getHeader("Origin");

        log.info("[Gateway] {} {} from {}", method, path, origin != null ? origin : "unknown");

        if (shouldSkipAuth(path)) {
            log.debug("[Gateway] Skipping auth for {}", path);
            filterChain.doFilter(request, response);
            log.info("[Gateway] {} {} -> {}", method, path, response.getStatus());
            return;
        }

        String sessionCookie = extractCookie(request, "better-auth.session_token");

        log.info("[Gateway] Session cookie found: {}", sessionCookie != null ? "YES" : "NO");
        if (sessionCookie != null) {
            log.info("[Gateway] Cookie length: {}", sessionCookie.length());
        }

        if (sessionCookie == null) {
            log.warn("[Gateway] {} {} -> 401 Missing session cookie", method, path);
            sendUnauthorized(response, "Missing session cookie");
            return;
        }

        try {
            SessionInfo sessionInfo = validateSession(sessionCookie);

            if (sessionInfo == null) {
                log.warn("[Gateway] {} {} -> 401 Invalid session", method, path);
                sendUnauthorized(response, "Invalid session");
                return;
            }

            log.info("[Gateway] Authenticated: userId={}, email={}, role={}",
                    sessionInfo.userId, sessionInfo.email, sessionInfo.role);

            HeaderAddingRequestWrapper wrappedRequest = new HeaderAddingRequestWrapper(request);
            wrappedRequest.addHeader("X-User-Id", sessionInfo.userId);
            wrappedRequest.addHeader("X-User-Email", sessionInfo.email);
            wrappedRequest.addHeader("X-User-Role", sessionInfo.role);

            filterChain.doFilter(wrappedRequest, response);
            log.info("[Gateway] {} {} -> {}", method, path, response.getStatus());

        } catch (Exception e) {
            log.error("[Gateway] {} {} -> 401 Session validation failed: {}", method, path, e.getMessage());
            sendUnauthorized(response, "Session validation failed");
        }
    }

    private boolean shouldSkipAuth(String path) {
        return path.startsWith("/api/v1/identity/") ||
                path.equals("/api/v1/media") ||
                path.startsWith("/api/v1/media/") ||
                path.startsWith("/actuator/");
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return HttpMethod.OPTIONS.matches(request.getMethod());
    }

    private String extractCookie(HttpServletRequest request, String cookieName) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(cookieName)) {
                    return cookie.getValue();
                }
            }
        }
        String secureCookieName = "__Secure-" + cookieName;
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals(secureCookieName)) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    private SessionInfo validateSession(String sessionCookie) {
        try {
            return restClient.get()
                    .uri("/internal/v1/validate-session")
                    .header("Cookie", "better-auth.session_token=" + sessionCookie)
                    .retrieve()
                    .body(SessionInfo.class);
        } catch (Exception e) {
            return null;
        }
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        response.getWriter().write("""
                {"type":"unauthorized","title":"Unauthorized","status":401,"detail":"%s"}
                """.formatted(message));
    }

    private record SessionInfo(String userId, String email, String role) {}

    private static class HeaderAddingRequestWrapper extends HttpServletRequestWrapper {
        private final Map<String, String> customHeaders = new HashMap<>();

        public HeaderAddingRequestWrapper(HttpServletRequest request) {
            super(request);
        }

        public void addHeader(String name, String value) {
            customHeaders.put(name, value);
        }

        @Override
        public String getHeader(String name) {
            String headerValue = customHeaders.get(name);
            if (headerValue != null) {
                return headerValue;
            }
            return super.getHeader(name);
        }

        @Override
        public Enumeration<String> getHeaderNames() {
            Set<String> names = new HashSet<>(customHeaders.keySet());
            Enumeration<String> originalNames = super.getHeaderNames();
            while (originalNames.hasMoreElements()) {
                names.add(originalNames.nextElement());
            }
            return Collections.enumeration(names);
        }

        @Override
        public Enumeration<String> getHeaders(String name) {
            String customValue = customHeaders.get(name);
            if (customValue != null) {
                return Collections.enumeration(Collections.singletonList(customValue));
            }
            return super.getHeaders(name);
        }
    }
}
