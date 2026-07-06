package com.example.gariconnectbackend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class Courrier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String description;
    private String type; // 'COLIS' ou 'COURRIER'

    private String nomExpediteur;
    private String telExpediteur;
    private String nomDestinataire;
    private String telDestinataire;

    @ManyToOne
    @JoinColumn(name = "expediteur_id", nullable = true)
    private User expediteurCompte;

    @ManyToOne
    @JoinColumn(name = "destinataire_id", nullable = true)
    private User destinataireCompte;

    private Double prix;
    private Double montantCommission;
    private String codeRetrait;
    private String statut = "EN_ATTENTE";

    @ManyToOne
    private Vehicule vehicule;

    @ManyToOne
    private User chauffeur;

    @ManyToOne
    private Trajet trajet;

    @ManyToOne
    private User agence;

    private LocalDateTime dateEnvoi = LocalDateTime.now();

    @Column(name = "poids_kg")
    private Double poidsKg;

    @Column(name = "valeur_estimee")
    private Double valeurEstimee;

    @Column(name = "est_fragile")
    private boolean estFragile;

    private String devise;

    // 🚀 NOUVEAU : Historisation du taux de change appliqué par l'agent lors de la validation
    @Column(name = "taux_applique")
    private Double tauxApplique;

    @Column(name = "niveau_risque_ia")
    private String niveauRisqueIA;

    @Column(name = "prix_suggere_ia")
    private Double prixSuggereIA;

    @Column(name = "justification_ia", columnDefinition = "TEXT")
    private String justificationIA;
}