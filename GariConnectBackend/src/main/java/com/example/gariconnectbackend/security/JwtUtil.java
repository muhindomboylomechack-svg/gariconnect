package com.example.gariconnectbackend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.stereotype.Component;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    private String secret = "MaCleSecreteGariConnect2026SuperSecureTresLongue";

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .setSigningKey(secret.getBytes())
                .parseClaimsJws(token)
                .getBody();
    }

    public String generateToken(String email, String role) {
        Map<String, Object> claims = new HashMap<>();
        // Force le préfixe ROLE_ pour que le JWT soit standardisé
        String formattedRole = role.startsWith("ROLE_") ? role : "ROLE_" + role;
        claims.put("role", formattedRole);
        return createToken(claims, email);
    }

    private String createToken(Map<String, Object> claims, String subject) {
        // Calcul pour 30 jours de validité :
        // 1000 ms * 60 s * 60 min * 24 h * 30 jours
        long expirationTimeInMs = 1000L * 60 * 60 * 24 * 30;

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expirationTimeInMs))
                .signWith(SignatureAlgorithm.HS256, secret.getBytes())
                .compact();
    }
}