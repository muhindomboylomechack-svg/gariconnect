package com.example.gariconnectbackend.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
@EnableMethodSecurity // Assure que @PreAuthorize fonctionne parfaitement sur vos contrôleurs
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter; //

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); //
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // 1. Routes publiques (AJOUT DE /uploads/** ET /error)
                        .requestMatchers("/api/auth/**", "/uploads/**", "/error").permitAll()

                        // 2. Gestion des demandes de récupération (Accessibles aux clients et gestionnaires)
                        .requestMatchers("/api/recuperations/**", "/api/recuperation/**").hasAnyRole("SUPER_ADMIN", "AGENCY_ADMIN", "AGENCY_MANAGER", "CLIENT")

                        // 3. Gestion des véhicules et chauffeurs (Agences uniquement)
                        .requestMatchers("/api/vehicules/**", "/api/chauffeurs/**").hasAnyRole("SUPER_ADMIN", "AGENCY_ADMIN", "AGENCY_MANAGER")

                        // 4. Statistiques et Finances (Administrateurs uniquement)
                        .requestMatchers("/api/statistiques/**", "/api/finance/**").hasAnyRole("SUPER_ADMIN", "AGENCY_ADMIN", "AGENCY_MANAGER")

                        // 5. Autoriser explicitement toutes les requêtes (GET, POST, PUT, PATCH, DELETE)
                        // sur les trajets et réservations pour le rôle CLIENT
                        .requestMatchers("/api/trajets/**", "/api/reservations/**").hasAnyRole("SUPER_ADMIN", "AGENCY_ADMIN", "AGENCY_MANAGER", "CHAUFFEUR", "CLIENT", "USER")

                        // Le reste nécessite d'être authentifié
                        .anyRequest().authenticated()
                );

        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration(); //
        config.setAllowedOriginPatterns(Arrays.asList( //
                "http://localhost:5173", //
                "https://*.onrender.com" //
        )); //
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")); //
        config.setAllowedHeaders(Arrays.asList("Authorization", "Cache-Control", "Content-Type", "Accept")); //
        config.setAllowCredentials(true); //

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource(); //
        source.registerCorsConfiguration("/**", config); //
        return source; //
    }
}