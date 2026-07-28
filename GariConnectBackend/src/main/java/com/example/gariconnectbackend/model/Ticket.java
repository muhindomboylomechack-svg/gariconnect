package com.example.gariconnectbackend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String codeTicket;

    @Column(nullable = false, columnDefinition = "VARCHAR(255) DEFAULT 'PAYE'")
    private String statut = "PAYE"; // Ou la valeur par défaut de ton choix (ex: 'VALIDE', 'PAYE', etc.)
    private LocalDateTime createdAt;

    @Column(name = "est_masque", nullable = false)
    private Boolean estMasque = false; // 🟢 Champ ajouté pour corriger l'erreur

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    // Attribut pour le QR Code / Code Ticket
    private String qrCodeData;



    // --- Getters et Setters explicités ---
    @ManyToOne
    @JoinColumn(name = "user_id")
    // 🟢 Ignorer les collections du User pour stopper la boucle
    @JsonIgnoreProperties({"tickets", "reservations", "password", "agenceEmployeur"})
    private User user;

    @ManyToOne
    @JoinColumn(name = "reservation_id")
    // 🟢 Ignorer le client depuis la réservation pour ne pas remonter dans l'arbre
    @JsonIgnoreProperties({"tickets", "client", "paiement"})
    private Reservation reservation;
    public Boolean getEstMasque() {
        return estMasque;
    }

    public void setEstMasque(Boolean estMasque) {
        this.estMasque = estMasque;
    }

    public String getQrCodeData() {
        return qrCodeData;
    }

    public void setQrCodeData(String qrCodeData) {
        this.qrCodeData = qrCodeData;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}