package com.example.gariconnectbackend.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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

import java.util.Arrays;

@Configuration
@EnableMethodSecurity // Assure le bon fonctionnement des annotations @PreAuthorize
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
                        // 🟢 Autoriser toutes les requêtes OPTIONS de pré-vérification (CORS)
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 1. 🔓 ROUTES STRICTEMENT PUBLIQUES (Page d'accueil & Consultation)
                        .requestMatchers(
                                "/api/auth/**",
                                "/uploads/**",
                                "/error",
                                "/api/trajets/tous",
                                "/api/trajets/recherche"
                        ).permitAll()

                        // Route publique pour un trajet unique
                        .requestMatchers(HttpMethod.GET, "/api/trajets/{id}").permitAll()

                        // =========================================================================
                        // 🛠️ OPTION A (SÉCURISÉE - RECOMMANDÉE POUR LA PRODUCTION)
                        // Seul le SUPER_ADMIN connecté avec son Token peut voir l'état du système.
                        // =========================================================================
                        .requestMatchers("/api/admin/system-health")
                        .hasAnyAuthority("SUPER_ADMIN", "ROLE_SUPER_ADMIN")

                        // 💡 NOTE DEV : Si vous testez encore sans Token JWT côté React, déplacez
                        // temporairement la ligne "/api/admin/system-health" dans le bloc .permitAll() ci-dessus.
                        // =========================================================================

                        // 2. Gestion des récupérations
                        .requestMatchers("/api/recuperations/**", "/api/recuperation/**")
                        .hasAnyAuthority("SUPER_ADMIN", "AGENCY_ADMIN", "AGENCY_MANAGER", "CLIENT", "CHAUFFEUR",
                                "ROLE_SUPER_ADMIN", "ROLE_AGENCY_ADMIN", "ROLE_AGENCY_MANAGER", "ROLE_CLIENT", "ROLE_CHAUFFEUR")

                        // 3. Gestion des véhicules et chauffeurs
                        .requestMatchers("/api/vehicules/**", "/api/chauffeurs/**")
                        .hasAnyAuthority("SUPER_ADMIN", "AGENCY_ADMIN", "AGENCY_MANAGER",
                                "ROLE_SUPER_ADMIN", "ROLE_AGENCY_ADMIN", "ROLE_AGENCY_MANAGER")

                        // 4. Statistiques et Finances
                        .requestMatchers("/api/statistiques/**", "/api/finance/**")
                        .hasAnyAuthority("SUPER_ADMIN", "AGENCY_ADMIN", "AGENCY_MANAGER",
                                "ROLE_SUPER_ADMIN", "ROLE_AGENCY_ADMIN", "ROLE_AGENCY_MANAGER")

                        // 5. 🔒 ROUTES PRIVÉES DES TRAJETS ET RÉSERVATIONS
                        .requestMatchers(
                                "/api/trajets/**",
                                "/api/reservations/**",
                                "/api/arrets",
                                "/api/arrets/**"
                        )
                        .hasAnyAuthority("SUPER_ADMIN", "AGENCY_ADMIN", "AGENCY_MANAGER", "CHAUFFEUR", "CLIENT", "USER",
                                "ROLE_SUPER_ADMIN", "ROLE_AGENCY_ADMIN", "ROLE_AGENCY_MANAGER", "ROLE_CHAUFFEUR", "ROLE_CLIENT", "ROLE_USER")

                        // 6. Gestion des notifications
                        .requestMatchers("/api/notifications/**")
                        .hasAnyAuthority("SUPER_ADMIN", "AGENCY_ADMIN", "AGENCY_MANAGER", "CHAUFFEUR", "CLIENT", "USER",
                                "ROLE_SUPER_ADMIN", "ROLE_AGENCY_ADMIN", "ROLE_AGENCY_MANAGER", "ROLE_CHAUFFEUR", "ROLE_CLIENT", "ROLE_USER")

                        // Sécurité par défaut pour toute autre route non listée
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
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}