
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
    private String photoUrl; // 🔥 NOUVEAU : Pour stocker l'URL de l'image

    // Constructeur complet mis à jour
    public AuthResponse(String token, Long id, String email, String role, String message, boolean mustChangePassword, String photoUrl) {
        this.token = token;
        this.id = id;
        this.email = email;
        this.role = role;
        this.message = message;
        this.mustChangePassword = mustChangePassword;
        this.photoUrl = photoUrl; // 🔥 Initialisation
    }
}