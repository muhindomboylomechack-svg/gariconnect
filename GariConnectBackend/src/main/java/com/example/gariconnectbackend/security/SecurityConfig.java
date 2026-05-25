package com.example.gariconnectbackend.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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

    /**
     * Bean PasswordEncoder pour le hachage des mots de passe.
     */
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
                        // 1. Routes Publiques (Accessibles sans être connecté)
                        .requestMatchers("/api/auth/**", "/api/public/**").permitAll()

                        // CORRECTION : Ajout de "/api/trajets" (URL racine) en plus de "/api/trajets/**"
                        .requestMatchers(HttpMethod.GET, "/api/trajets", "/api/trajets/**").permitAll()

                        // 2. Route spécifique CHAUFFEUR (doit être AVANT la route générale)
                        .requestMatchers("/api/evaluations/mon-rapport").hasRole("CHAUFFEUR")

                        // 3. Autres évaluations
                        .requestMatchers("/api/evaluations/**").hasAnyRole("CLIENT", "AGENCE", "ADMIN")

                        // 4. Autres services
                        .requestMatchers("/api/reservations/**").hasAnyRole("CLIENT", "AGENCE", "CHAUFFEUR", "ADMIN")
                        .requestMatchers("/api/paiements/**", "/api/finance/**").hasAnyRole("AGENCE", "ADMIN")
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        .anyRequest().authenticated()
                );

        http.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // MODIFICATION ICI : On autorise ton frontend local ET ton frontend en production
        config.setAllowedOrigins(Arrays.asList(
                "http://localhost:5173",             // Pour tes tests sur ton PC
                "https://gariconnect.onrender.com"   // Pour la production (⚠️ Vérifie que c'est bien l'URL de ton FRONTEND, pas du backend)
        ));

        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept"));
        config.setAllowCredentials(true); // Indispensable pour que le token soit bien transmis

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}