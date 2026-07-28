package com.example.gariconnectbackend.model;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date_reservation")
    @JsonProperty("date_reservation")
    private LocalDateTime dateReservation;

    @Column(name = "numero_siege")
    @JsonProperty("numero_siege")
    private Integer numeroSiege;

    // 💳 RELATION BIDIRECTIONNELLE AVEC LE PAIEMENT
    @OneToOne(mappedBy = "reservation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonProperty("paiement")
    @JsonIgnoreProperties("reservation")
    private Paiement paiement;

    private String typeReservation; // Stockera "STANDARD" ou "VIP"
    private String statut;          // "EN_ATTENTE_DE_PAIEMENT", "PAYE", etc.
    private Double montantPaye;

    // --- DÉTAILS FINANCIERS ---
    private Double montantCommission;
    private Double partAgence;

    // --- SÉCURITÉ & TICKETS ---
    @Column(name = "code_ticket")
    @JsonProperty("code_ticket")
    private String codeTicket;

    // Double compatibilité à la désérialisation
    @ManyToOne(cascade = CascadeType.MERGE)
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"reservations", "password", "trajets", "vehicules", "agenceEmployeur", "hibernateLazyInitializer", "handler"})
    @JsonProperty("client")
    @JsonAlias("user")
    private User client;

    private String referenceTransaction;
    private String modePaiement;
    private Boolean estPaye;

    @ManyToOne
    @JoinColumn(name = "trajet_id")
    @JsonIgnoreProperties({"reservations", "hibernateLazyInitializer", "handler"})
    private Trajet trajet;

    @ManyToOne
    @JoinColumn(name = "vehicule_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Vehicule vehicule;

    // 🛑 RELATION VIP : Gère la récupération à domicile
    @OneToOne(mappedBy = "reservation", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonProperty("demande_recuperation")
    @JsonIgnoreProperties("reservation")
    private DemandeRecuperation demandeRecuperation;

    @Column(name = "nombre_places", columnDefinition = "integer default 1")
    private Integer nombrePlaces = 1;

    // 🟢 CHAMP CORRIGÉ : Type Wrapper 'Boolean' pour éviter les crashs sur NULL en BDD
    @Column(name = "masque_pour_client")
    private Boolean masquePourClient = false;

    // 🟢 Arrêt où le client attend le bus
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "arret_montage_id")
    private ArretBus arretMontage;

    // 🟢 Arrêt où le client descend
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "arret_descente_id")
    private ArretBus arretDescente;

    // 🟢 Statut spécifique lié à l'embarquement
    @Enumerated(EnumType.STRING)
    @Column(name = "statut_embarquement")
    private StatutPassagerArret statutEmbarquement = StatutPassagerArret.EN_ATTENTE_A_L_ARRET;

    // 🟢 Lien vers la course précise du jour
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Course courseAssignee;


    // 💵 CALCUL DYNAMIQUE DU MONTANT TOTAL
    @Transient
    @JsonProperty("montant_total")
    public Double getMontantTotal() {
        Double prixBase = 0.0;

        // Sécurité : au moins 1 place si non spécifié
        int places = (this.nombrePlaces != null && this.nombrePlaces > 0) ? this.nombrePlaces : 1;

        if (this.montantPaye != null && this.montantPaye > 0) {
            prixBase = this.montantPaye;
        } else if (this.trajet != null && this.trajet.getPrix() != null) {
            // MULTIPLICATION DU PRIX PAR LE NOMBRE DE PLACES
            prixBase = this.trajet.getPrix() * places;
        }

        if (this.demandeRecuperation != null && this.demandeRecuperation.getPrixSupplementaire() != null) {
            prixBase += this.demandeRecuperation.getPrixSupplementaire();
        }

        return prixBase;
    }

    // 🟢 GETTER SÉCURISÉ POUR MASQUE_POUR_CLIENT
    public Boolean getMasquePourClient() {
        return masquePourClient != null ? masquePourClient : false;
    }

    public void setMasquePourClient(Boolean masquePourClient) {
        this.masquePourClient = masquePourClient != null ? masquePourClient : false;
    }
}