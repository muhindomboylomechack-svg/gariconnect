//
//package com.example.gariconnectbackend.dto;
//
//import lombok.Data;
//
//@Data
//public class AuthResponse {
//    private String token;
//    private Long id;
//    private String email;
//    private String role;
//    private String message;
//    private boolean mustChangePassword; // Pour React
//    private String photoUrl; // 🔥 NOUVEAU : Pour stocker l'URL de l'image
//
//    // Constructeur complet mis à jour
//    public AuthResponse(String token, Long id, String email, String role, String message, boolean mustChangePassword, String photoUrl) {
//        this.token = token;
//        this.id = id;
//        this.email = email;
//        this.role = role;
//        this.message = message;
//        this.mustChangePassword = mustChangePassword;
//        this.photoUrl = photoUrl; // 🔥 Initialisation
//    }
//}
package com.example.gariconnectbackend.dto;

import lombok.Data;

@Data
public class AuthResponse {
    private String token;
    private Long id;
    private String email;
    private String role;
    private String message;
    private boolean mustChangePassword;
    private String photoUrl;

    // 🔥 NOUVEAUX CHAMPS REQUIS POUR L'ÉCRAN DE BLOCAGE
    private String statut;
    private String agenceTelephone;
    private String agenceEmail;
    private String agenceNom;

    // Constructeur complet mis à jour
    public AuthResponse(String token, Long id, String email, String role, String message,
                        boolean mustChangePassword, String photoUrl, String statut,
                        String agenceTelephone, String agenceEmail, String agenceNom) {
        this.token = token;
        this.id = id;
        this.email = email;
        this.role = role;
        this.message = message;
        this.mustChangePassword = mustChangePassword;
        this.photoUrl = photoUrl;
        this.statut = statut;
        this.agenceTelephone = agenceTelephone;
        this.agenceEmail = agenceEmail;
        this.agenceNom = agenceNom;
    }
}