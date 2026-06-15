package com.example.gariconnectbackend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservations")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
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

    private String statut;
    private Double montantPaye;

    // --- DÉTAILS FINANCIERS ---
    private Double montantCommission; // Part Admin
    private Double partAgence;        // Part Agence

    // --- SÉCURITÉ & TICKETS ---
    @Column(name = "code_ticket")
    @JsonProperty("code_ticket")
    private String codeTicket;

    // Double compatibilité à la désérialisation (accepte 'client' ou 'user' du frontend)
    @ManyToOne(cascade = CascadeType.MERGE)
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"reservations", "password", "trajets", "vehicules", "agenceEmployeur"})
    @JsonProperty("client")
    @JsonAlias("user")
    private User client;

    @ManyToOne
    @JoinColumn(name = "trajet_id")
    private Trajet trajet;

    @ManyToOne
    @JoinColumn(name = "vehicule_id")
    private Vehicule vehicule;
    // --- MODE DE PAIEMENT ---
    @Column(name = "mode_paiement")
    @com.fasterxml.jackson.annotation.JsonProperty("mode_paiement")
    private String modePaiement;
    // =========================================================================
    // GETTERS ET SETTERS MANUELS (Surcharge et compatibilité)
    // =========================================================================

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getDateReservation() {
        return dateReservation;
    }

    public void setDateReservation(LocalDateTime dateReservation) {
        this.dateReservation = dateReservation;
    }

    public Integer getNumeroSiege() {
        return numeroSiege;
    }

    public void setNumeroSiege(Integer numeroSiege) {
        this.numeroSiege = numeroSiege;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }

    public Double getMontantPaye() {
        return montantPaye;
    }

    public void setMontantPaye(Double montantPaye) {
        this.montantPaye = montantPaye;
    }

    public Double getMontantCommission() {
        return montantCommission;
    }

    public void setMontantCommission(Double montantCommission) {
        this.montantCommission = montantCommission;
    }

    public Double getPartAgence() {
        return partAgence;
    }

    public void setPartAgence(Double partAgence) {
        this.partAgence = partAgence;
    }

    public String getCodeTicket() {
        return codeTicket;
    }

    public void setCodeTicket(String codeTicket) {
        this.codeTicket = codeTicket;
    }


    public void setClient(User client) {
        this.client = client;
    }

    // --- Double compatibilité à la sérialisation JSON ---
    // Cela force Jackson à générer une clé "client" dans le JSON
    @JsonProperty("client")
    public User getClient() {
        return this.client;
    }

    // Cela force Jackson à générer AUSSI une clé "user" dupliquée dans le JSON
    @JsonProperty("user")
    public User getUser() {
        return this.client;
    }

    @JsonProperty("user")
    public void setUser(User user) {
        this.client = user;
    }

    public Trajet getTrajet() {
        return trajet;
    }

    public void setTrajet(Trajet trajet) {
        this.trajet = trajet;
    }

    public Vehicule getVehicule() {
        return vehicule;
    }

    public void setVehicule(Vehicule vehicule) {
        this.vehicule = vehicule;
    }
    public void setReferencePaiement(String caisse) {
    }


}