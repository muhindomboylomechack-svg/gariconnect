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

    // AJOUT : Pour différencier 'COLIS' et 'COURRIER'
    private String type;

    private String nomExpediteur;
    private String telExpediteur;
    private String nomDestinataire;
    private String telDestinataire;

    private Double prix;
    private Double montantCommission;
    private String codeRetrait;

    // MISE À JOUR : Statuts demandés
    // Valeurs conseillées : "EN_ATTENTE", "EN_ROUTE", "ARRIVE"
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
    private Double poidsKg; // Résout getPoidsKg()

    @Column(name = "valeur_estimee")
    private Double valeurEstimee; // Résout getValeurEstimee()

    @Column(name = "est_fragile")
    private boolean estFragile; // Résout isEstFragile() avec Lombok (génère automatiquement isEstFragile)

    // =========================================================================
    // 🤖 NOUVEAU : Ajout des champs pour l'intégration de l'IA

    // Dans Courrier.java



    // =========================================================================

    @Column(name = "niveau_risque_ia")
    private String niveauRisqueIA; // Résout setNiveauRisqueIA()

    @Column(name = "prix_suggere_ia")
    private Double prixSuggereIA; // Résout setPrixSuggereIA()

    // On utilise columnDefinition = "TEXT" car la justification de l'IA peut être longue
    @Column(name = "justification_ia", columnDefinition = "TEXT")
    private String justificationIA; // Résout setJustificationIA()
}