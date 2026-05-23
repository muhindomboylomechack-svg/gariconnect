package com.example.gariconnectbackend.dto;

import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private Long id;
    private String email;
    private String role;
    private String message;
    private boolean mustChangePassword; // Pour React

    public AuthResponse(String token, Long id, String email, String role, String message, boolean mustChangePassword) {
        this.token = token;
        this.id = id;
        this.email = email;
        this.role = role;
        this.message = message;
        this.mustChangePassword = mustChangePassword;
    }
}