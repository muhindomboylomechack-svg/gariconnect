package com.example.gariconnectbackend.model;

import jakarta.persistence.*;
        import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "commissions_dettes")
public class CommissionDette {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "agence_id")
    private User agence;

    @ManyToOne
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    @ManyToOne // Ajout pour le module Courrier
    @JoinColumn(name = "courrier_id")
    private Courrier courrier;

    @OneToOne // Conservation de ta logique de paiement
    @JoinColumn(name = "paiement_id")
    private Paiement paiement;

    private String libelle;
    private Double montant; // Montant total de l'opération
    private Double montantCommission; // Taux de commission
    private Double montantDu; // Ce que l'agence doit réellement à l'admin

    private boolean reglee = false;
    private LocalDateTime dateCreation = LocalDateTime.now();

    // --- Méthodes de compatibilité pour tes contrôleurs actuels ---

    public void setLibelle(String libelle) {
        this.libelle = libelle;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }

    // Cette méthode vide dans ton fichier bloquait peut-être ta logique
    public void setStatut(String statut) {
        // Tu peux l'utiliser pour loguer un changement ou la supprimer si inutile
    }

    public void setDateGeneration(LocalDateTime now) {
    }
}