package com.example.gariconnectbackend.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Routes publiques
                        .requestMatchers("/api/auth/**").permitAll()

                        // CORRECTION : Autoriser SUPER_ADMIN et AGENCY_ADMIN (le filtrage granulaire se fait via @PreAuthorize dans le contrôleur)
                        .requestMatchers("/api/admin/**").hasAnyRole("SUPER_ADMIN", "AGENCY_ADMIN")

                        // CORRECTION : Remplacement de "ADMIN" par "AGENCY_ADMIN"
                        .requestMatchers("/api/users/**").hasAnyRole("SUPER_ADMIN", "AGENCY_ADMIN", "AGENCY_MANAGER")

                        // CORRECTION : Remplacement de "AGENCE" par "AGENCY_ADMIN", "AGENCY_MANAGER"
                        .requestMatchers("/api/paiements/**", "/api/finance/**").hasAnyRole("SUPER_ADMIN", "AGENCY_ADMIN", "AGENCY_MANAGER")
                      //  .requestMatchers("/api/users/**").hasAnyRole("SUPER_ADMIN", "AGENCY_ADMIN", "AGENCY_MANAGER")
                        // Le reste nécessite simplement d'être authentifié (Notifications, Trajets, etc.)
                        .anyRequest().authenticated()
                );

        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:5173",
                "https://*.onrender.com"
        ));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("Authorization", "Cache-Control", "Content-Type", "Accept"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}