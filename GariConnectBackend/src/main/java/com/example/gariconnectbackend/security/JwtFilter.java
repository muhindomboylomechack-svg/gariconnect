package com.example.gariconnectbackend.security;

import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository; // 🟢 AJOUT : Injecter le repository pour vérifier le statut

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                String email = jwtUtil.extractEmail(token);

                if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                    // 🟢 NOUVEAU : Vérifier si l'utilisateur est bloqué en BDD
                    Optional<User> userOpt = userRepository.findByEmail(email);
                    if (userOpt.isPresent() && "BLOQUE".equals(userOpt.get().getStatut())) {
                        // Si l'utilisateur est bloqué, on renvoie une erreur 403 Forbidden immédiatement
                        response.setStatus(HttpStatus.FORBIDDEN.value());
                        response.setContentType("application/json");
                        response.getWriter().write("{\"message\": \"Votre compte a été suspendu. Contactez l'administrateur.\"}");
                        return; // Arrête la chaîne de traitement ici
                    }

                    String role = jwtUtil.extractClaim(token, claims -> claims.get("role", String.class));

                    if (role != null) {
                        String cleanRole = role.replace("ROLE_", "");
                        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + cleanRole);

                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                email, null, Collections.singletonList(authority)
                        );

                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                }
            } catch (Exception e) {
                System.err.println("JWT Authentication Error: " + e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }
}
//package com.example.gariconnectbackend.security;
//
//import jakarta.servlet.FilterChain;
//import jakarta.servlet.ServletException;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
//import org.springframework.security.core.authority.SimpleGrantedAuthority;
//import org.springframework.security.core.context.SecurityContextHolder;
//import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
//import org.springframework.stereotype.Component;
//import org.springframework.web.filter.OncePerRequestFilter;
//
//import java.io.IOException;
//import java.util.Collections;
//
//@Component
//public class JwtFilter extends OncePerRequestFilter {
//
//    @Autowired
//    private JwtUtil jwtUtil;
//
//    @Override
//    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
//            throws ServletException, IOException {
//
//        String authHeader = request.getHeader("Authorization");
//
//        if (authHeader != null && authHeader.startsWith("Bearer ")) {
//            String token = authHeader.substring(7);
//            try {
//                String email = jwtUtil.extractEmail(token);
//
//                if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
//                    String role = jwtUtil.extractClaim(token, claims -> claims.get("role", String.class));
//
//                    if (role != null) {
//                        // Normalisation stricte pour Spring Security :
//                        // hasAnyRole("ADMIN") attend l'autorité "ROLE_ADMIN".
//                        String cleanRole = role.replace("ROLE_", "");
//                        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + cleanRole);
//
//                        // Création du jeton d'authentification pour le contexte Spring Security
//                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
//                                email,
//                                null,
//                                Collections.singletonList(authority)
//                        );
//
//                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
//
//                        // Injection dans le contexte de sécurité
//                        SecurityContextHolder.getContext().setAuthentication(authToken);
//                    }
//                }
//            } catch (Exception e) {
//                System.err.println("JWT Authentication Error: " + e.getMessage());
//            }
//        }
//
//        // Poursuite de la chaîne de filtres
//        filterChain.doFilter(request, response);
//    }
//}