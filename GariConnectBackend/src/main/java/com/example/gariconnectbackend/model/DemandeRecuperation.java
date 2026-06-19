//package com.example.gariconnectbackend.model;
//
//import jakarta.persistence.*;
//        import lombok.*;
//        import java.time.LocalDateTime;
//
//@Entity
//@Table(name = "demandes_recuperation")
//@Getter
//@Setter
//@NoArgsConstructor
//@AllArgsConstructor
//@Builder
//public class DemandeRecuperation {
//
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    private Long id;
//
//    // Le client qui fait la demande de ramassage
//    @ManyToOne(fetch = FetchType.EAGER)
//    @JoinColumn(name = "client_id", nullable = false)
//    private User client;
//
//    // L'identifiant de la réservation ou du billet associé
//    @Column(name = "reservation_id", nullable = false)
//    private Long reservationId;
//
//    // --- COORDONNÉES GPS DU CLIENT ---
//    @Column(nullable = false)
//    private Double latitudeClient;
//
//    @Column(nullable = false)
//    private Double longitudeClient;
//
//    // Description textuelle du lieu donnée par le client (Ex: "Quartier Matonge, Av. du Stade, No 12")
//    @Column(columnDefinition = "TEXT")
//    private String adresseTextuelle;
//
//    // --- DONNÉES FIXÉES PAR L'AGENT DE L'AGENCE ---
//    // Point de repère choisi par l'agent (Ex: "Rond-point du 30 Juin")
//    private String pointRepereAgence;
//
//    // Distance finale calculée ou estimée en kilomètres (Ex: 2.5)
//    private Double distanceEstimee;
//
//    // Le prix supplémentaire calculé (Ex: Distance * 5000 FC = 12500 FC)
//    private Double prixSupplementaire;
//
//    // --- SUIVI ET AUDIT ---
//    @Enumerated(EnumType.STRING)
//    @Column(nullable = false)
//    private StatutRecuperation statut = StatutRecuperation.EN_ATTENTE_COTATION;
//
//    private LocalDateTime dateDemande;
//    private LocalDateTime dateValidationParAgent;
//
//    // Remplissage automatique de la date à la création de la demande
//    @PrePersist
//    protected void onCreate() {
//        this.dateDemande = LocalDateTime.now();
//    }
//}
package com.example.gariconnectbackend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "demandes_recuperation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandeRecuperation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Le client qui fait la demande de ramassage
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "client_id", nullable = false)
    private User client;

    // L'identifiant brut (gardé pour la compatibilité de vos requêtes existantes)
    @Column(name = "reservation_id", nullable = false)
    private Long reservationId;

    // 🛑 CORRECTION : Évite la récursion infinie JSON (StackOverflowError)
    @OneToOne
    @JoinColumn(name = "reservation_id", referencedColumnName = "id", insertable = false, updatable = false)
    @JsonIgnoreProperties("demandeRecuperation")
    private Reservation reservation;

    // --- COORDONNÉES GPS DU CLIENT ---
    @Column(nullable = false)
    private Double latitudeClient;

    @Column(nullable = false)
    private Double longitudeClient;

    @Column(columnDefinition = "TEXT")
    private String adresseTextuelle;

    // --- DONNÉES FIXÉES PAR L'AGENT DE L'AGENCE ---
    private String pointRepereAgence;
    private Double distanceEstimee;
    private Double prixSupplementaire;

    // --- SUIVI ET AUDIT ---
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutRecuperation statut;
}