package com.example.gariconnectbackend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "evaluations")
@Data
public class Evaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Assure-toi d'avoir une entité Reservation
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false)
    private Reservation reservation;

    // Le client qui évalue
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private User client;

    // Le chauffeur évalué (tiré de ta classe User)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chauffeur_id")
    private User chauffeur;

    // Assure-toi d'avoir une entité Vehicule
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicule_id")
    private Vehicule vehicule;

    @Column(name = "note_globale", nullable = false)
    private Integer noteGlobale;

    @Column(name = "note_conduite")
    private Integer noteConduite;

    @Column(name = "note_confort")
    private Integer noteConfort;

    @Column(name = "note_ponctualite")
    private Integer notePonctualite;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @Column(name = "date_evaluation")
    private LocalDateTime dateEvaluation = LocalDateTime.now();
}