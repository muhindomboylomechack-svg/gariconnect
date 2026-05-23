package com.example.gariconnectbackend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Table(name = "paiements")
public class Paiement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double montant;
    private String modePaiement;
    private String statut;
    private String referenceTransaction;

    @OneToOne
    @JoinColumn(name = "reservation_id")
    private Reservation reservation;

    private LocalDateTime datePaiement;

    // --- GETTERS ET SETTERS (Obligatoires pour enlever le rouge) ---

}