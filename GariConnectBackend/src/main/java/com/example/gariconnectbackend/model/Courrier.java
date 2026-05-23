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
}