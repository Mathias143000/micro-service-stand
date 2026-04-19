package com.example.realestate.config;

import com.example.realestate.security.CustomUserDetailsService;
import com.example.realestate.security.JwtAuthenticationFilter;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService userDetailsService;

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:8080}")
    private String allowedOrigins;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            CustomUserDetailsService userDetailsService
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/",
                                "/index.html",
                                "/assets/**",
                                "/favicon.ico",
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/webjars/**",
                                "/actuator/health",
                                "/actuator/health/**",
                                "/actuator/info"
                        ).permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/images/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/listings/**").permitAll()

                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/password/reset").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/password/confirm").permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/auth/me").hasAnyRole("ADMIN", "REALTOR", "BANK_EMPLOYEE")
                        .requestMatchers(HttpMethod.POST, "/api/auth/register").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.GET, "/api/organizations/reference").hasAnyRole("ADMIN", "REALTOR", "BANK_EMPLOYEE")
                        .requestMatchers(HttpMethod.GET, "/api/organizations/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/organizations/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/organizations/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/organizations/**").hasRole("ADMIN")

                        .requestMatchers("/api/users/**").hasRole("ADMIN")

                        .requestMatchers(HttpMethod.GET, "/api/credits/**").hasAnyRole("ADMIN", "BANK_EMPLOYEE")
                        .requestMatchers(HttpMethod.POST, "/api/credits/**").hasAnyRole("ADMIN", "BANK_EMPLOYEE")
                        .requestMatchers(HttpMethod.PUT, "/api/credits/*/status").hasAnyRole("ADMIN", "BANK_EMPLOYEE")

                        .requestMatchers(HttpMethod.GET, "/api/payments/**").hasAnyRole("ADMIN", "BANK_EMPLOYEE")
                        .requestMatchers(HttpMethod.POST, "/api/payments/**").hasAnyRole("ADMIN", "BANK_EMPLOYEE")
                        .requestMatchers(HttpMethod.PUT, "/api/payments/*/status").hasAnyRole("ADMIN", "BANK_EMPLOYEE")

                        .requestMatchers(HttpMethod.GET, "/api/contracts/**").hasAnyRole("ADMIN", "REALTOR")
                        .requestMatchers(HttpMethod.POST, "/api/contracts/**").hasAnyRole("ADMIN", "REALTOR")
                        .requestMatchers(HttpMethod.PUT, "/api/contracts/**").hasAnyRole("ADMIN", "REALTOR")

                        .requestMatchers(HttpMethod.POST, "/api/properties/*/images").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/properties/images/*").authenticated()

                        .requestMatchers(HttpMethod.GET, "/api/properties/**").hasAnyRole("ADMIN", "REALTOR")
                        .requestMatchers(HttpMethod.POST, "/api/properties/**").hasAnyRole("ADMIN", "REALTOR")
                        .requestMatchers(HttpMethod.PUT, "/api/properties/**").hasAnyRole("ADMIN", "REALTOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/properties/**").hasAnyRole("ADMIN", "REALTOR")

                        .requestMatchers(HttpMethod.GET, "/api/deals/reference").hasAnyRole("ADMIN", "REALTOR", "BANK_EMPLOYEE")
                        .requestMatchers(HttpMethod.GET, "/api/deals/**").hasAnyRole("ADMIN", "REALTOR")
                        .requestMatchers(HttpMethod.POST, "/api/deals/**").hasAnyRole("ADMIN", "REALTOR")
                        .requestMatchers(HttpMethod.PUT, "/api/deals/**").hasAnyRole("ADMIN", "REALTOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/deals/**").hasAnyRole("ADMIN", "REALTOR")

                        .requestMatchers("/api/chats/**").hasAnyRole("ADMIN", "REALTOR")
                        .requestMatchers("/api/analytics/**").hasAnyRole("ADMIN", "REALTOR")
                        .requestMatchers(HttpMethod.GET, "/api/internal/dashboard/**").hasAnyRole("ADMIN", "REALTOR", "BANK_EMPLOYEE")
                        .requestMatchers("/api/internal/support-chat/**").hasAnyRole("ADMIN", "REALTOR")
                        .requestMatchers(HttpMethod.GET, "/api/internal/marketplace-deals/**").hasAnyRole("ADMIN", "REALTOR")
                        .requestMatchers(HttpMethod.PUT, "/api/internal/marketplace-deals/**").hasAnyRole("ADMIN", "REALTOR")

                        .requestMatchers(HttpMethod.GET, "/api/me").hasRole("MARKETPLACE_USER")
                        .requestMatchers("/api/support-chat/**").hasRole("MARKETPLACE_USER")
                        .requestMatchers(HttpMethod.GET, "/api/marketplace-deals/**").hasRole("MARKETPLACE_USER")
                        .requestMatchers(HttpMethod.POST, "/api/marketplace-deals").hasRole("MARKETPLACE_USER")
                        .requestMatchers(HttpMethod.POST, "/api/favorites/toggle").hasRole("MARKETPLACE_USER")
                        .requestMatchers(HttpMethod.POST, "/api/favorites/price-alert").hasRole("MARKETPLACE_USER")
                        .requestMatchers("/api/favorites/**").hasAnyRole("ADMIN", "REALTOR")
                        .requestMatchers(HttpMethod.GET, "/api/profile/listings").hasRole("MARKETPLACE_USER")
                        .requestMatchers(HttpMethod.POST, "/api/listings").hasRole("MARKETPLACE_USER")
                        .requestMatchers(HttpMethod.PUT, "/api/listings/**").hasRole("MARKETPLACE_USER")
                        .requestMatchers(HttpMethod.DELETE, "/api/listings/**").hasRole("MARKETPLACE_USER")

                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/posts/**").permitAll()
                        .requestMatchers("/users/**").permitAll()

                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .collect(Collectors.toList());
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(PasswordEncoder encoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(encoder);
        return new ProviderManager(provider);
    }
}
