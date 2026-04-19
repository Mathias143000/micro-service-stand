package com.example.realestate.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Slf4j
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

  private final JwtTokenProvider tokenProvider;
  private final CustomUserDetailsService userDetailsService;

  public JwtAuthenticationFilter(
          JwtTokenProvider tokenProvider,
          CustomUserDetailsService userDetailsService
  ) {
    this.tokenProvider = tokenProvider;
    this.userDetailsService = userDetailsService;
  }

  @Override
  protected boolean shouldNotFilter(HttpServletRequest request) {
    String path = request.getServletPath();

    // Swagger / OpenAPI
    if (path.equals("/swagger-ui.html")) return true;
    if (path.startsWith("/swagger-ui")) return true;
    if (path.startsWith("/v3/api-docs")) return true;

    // Webjars (если вдруг будут)
    if (path.startsWith("/webjars")) return true;

    // Error page (чтобы не лезть в /error)
    if (path.equals("/error")) return true;

    return false;
  }

  @Override
  protected void doFilterInternal(
          HttpServletRequest request,
          HttpServletResponse response,
          FilterChain filterChain
  ) throws ServletException, IOException {

    try {
      String token = resolveToken(request);

      if (token != null) {
        if (tokenProvider.validateToken(token)) {
          String email = tokenProvider.getUsername(token);

          log.debug("JWT OK, user={}", email);

          if (email != null &&
                  SecurityContextHolder.getContext().getAuthentication() == null) {

            UserDetails userDetails = userDetailsService.loadUserByUsername(email);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );

            authentication.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request)
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            log.debug(
                    "SecurityContext set: user={}, roles={}",
                    userDetails.getUsername(),
                    userDetails.getAuthorities()
            );
          }
        } else {
          log.warn("JWT invalid");
        }
      }
    } catch (Exception e) {
      log.error("JWT auth error", e);
    }

    filterChain.doFilter(request, response);
  }

  private String resolveToken(HttpServletRequest request) {
    String header = request.getHeader("Authorization");
    if (header != null && header.startsWith("Bearer ")) {
      return header.substring(7);
    }

    Cookie[] cookies = request.getCookies();
    if (cookies == null) {
      return null;
    }

    for (Cookie cookie : cookies) {
      if ("token".equals(cookie.getName()) && cookie.getValue() != null && !cookie.getValue().isBlank()) {
        return cookie.getValue();
      }
    }

    return null;
  }
}
