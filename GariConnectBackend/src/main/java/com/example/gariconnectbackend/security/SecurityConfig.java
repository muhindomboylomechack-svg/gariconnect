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

        // Accepte ton PC local ainsi que TOUS les sous-domaines provenant de *.onrender.com
        config.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:5173",
                "https://*.onrender.com"
        ));

        // Autorise toutes les méthodes HTTP nécessaires pour ton application SaaS
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // Autorise les headers essentiels (y compris l'Authorization contenant ton Token JWT)
        config.setAllowedHeaders(Arrays.asList("Authorization", "Cache-Control", "Content-Type", "Accept"));

        // Indispensable pour que le token JWT et les cookies transitent correctement
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
    
}