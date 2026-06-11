package com.example.gariconnectbackend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String message;
    private LocalDateTime date = LocalDateTime.now();
    private boolean lue = false;
    // Dans votre classe Notification.java
    private String typeAction;  // Exemple : "PAIEMENT_RESERVATION"
    private Long referenceId;   // L'ID de la réservation concernée
    @ManyToOne(fetch = FetchType.EAGER)
    // ✅ Utilise le nom EXACT de ta colonne en base de données (vu sur ton image SQL)
    @JoinColumn(name = "utilisateur_id")
    // ✅ Sécurité et anti-boucle
    @JsonIgnoreProperties({
            "notifications",
            "password",
            "handler",
            "hibernateLazyInitializer",
            "agenceEmployeur",
            "trajet"
    })
    private User destinataire;
}