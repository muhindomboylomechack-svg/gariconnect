//package com.example.gariconnectbackend.model;
//
//import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
//import com.fasterxml.jackson.annotation.JsonProperty;
//import com.fasterxml.jackson.annotation.JsonAlias;
//import jakarta.persistence.*;
//import lombok.*;
//import java.time.LocalDateTime;
//import jakarta.persistence.Transient;
//@Entity
//@Table(name = "reservations")
//@Getter @Setter
//@NoArgsConstructor @AllArgsConstructor
//public class Reservation {
//
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    private Long id;
//
//    @Column(name = "date_reservation")
//    @JsonProperty("date_reservation")
//    private LocalDateTime dateReservation;
//
//    @Column(name = "numero_siege")
//    @JsonProperty("numero_siege")
//    private Integer numeroSiege;
//
//    private String statut;
//    private Double montantPaye;
//
//    // --- DÉTAILS FINANCIERS ---
//    private Double montantCommission; // Part Admin
//    private Double partAgence;        // Part Agence
//
//    // --- SÉCURITÉ & TICKETS ---
//    @Column(name = "code_ticket")
//    @JsonProperty("code_ticket")
//    private String codeTicket;
//
//    // Double compatibilité à la désérialisation (accepte 'client' ou 'user' du frontend)
//    @ManyToOne(cascade = CascadeType.MERGE)
//    @JoinColumn(name = "user_id")
//    @JsonIgnoreProperties({"reservations", "password", "trajets", "vehicules", "agenceEmployeur"})
//    @JsonProperty("client")
//    @JsonAlias("user")
//    private User client;
//
//    @ManyToOne
//    @JoinColumn(name = "trajet_id")
//    private Trajet trajet;
//
//    @ManyToOne
//    @JoinColumn(name = "vehicule_id")
//    private Vehicule vehicule;
//    // --- MODE DE PAIEMENT ---
//    @Column(name = "mode_paiement")
//    @com.fasterxml.jackson.annotation.JsonProperty("mode_paiement")
//    private String modePaiement;
//    // =========================================================================
//    // GETTERS ET SETTERS MANUELS (Surcharge et compatibilité)
//    // =========================================================================
//// --- CALCUL DYNAMIQUE POUR L'AGENCE ET LES RAPPORTS ---
//    @Transient // Ne crée pas de colonne en BDD
//    @JsonProperty("montantTotalAvecSurplus")
//    public Double getMontantTotalAvecSurplus() {
//        double total = 0.0;
//
//        // 1. On prend la base du prix du billet
//        if (this.montantPaye != null && this.montantPaye > 0) {
//            total += this.montantPaye;
//        } else if (this.getTrajet() != null && this.getTrajet().getPrix() != null) {
//            total += this.getTrajet().getPrix();
//        }
//
//        return total;
//    }
//    // --- LIAISON AVEC LA RÉCUPÉRATION À DOMICILE ---
//    @OneToOne(mappedBy = "reservation", cascade = CascadeType.MERGE, fetch = FetchType.EAGER)
//    @com.fasterxml.jackson.annotation.JsonIgnoreProperties("reservation") // Évite les boucles infinies de sérialisation
//    private DemandeRecuperation demandeRecuperation;
//
//    // --- CALCUL DYNAMIQUE DU TOTAL POUR LE FRONTEND ---
//    @Transient // Indique à JPA de ne pas chercher ce champ dans la table de la BDD
//    @JsonProperty("montant_total")
//    public Double getMontantTotal() {
//        Double total = (this.montantPaye != null) ? this.montantPaye : 0.0;
//
//        // Si une demande de récupération existe, on ajoute ses frais au total
//        if (this.demandeRecuperation != null && this.demandeRecuperation.getPrixSupplementaire() != null) {
//            total += this.demandeRecuperation.getPrixSupplementaire();
//        }
//
//        return total;
//    }
//    public Long getId() {
//        return id;
//    }
//
//    public void setId(Long id) {
//        this.id = id;
//    }
//
//    public LocalDateTime getDateReservation() {
//        return dateReservation;
//    }
//
//    public void setDateReservation(LocalDateTime dateReservation) {
//        this.dateReservation = dateReservation;
//    }
//
//    public Integer getNumeroSiege() {
//        return numeroSiege;
//    }
//
//    public void setNumeroSiege(Integer numeroSiege) {
//        this.numeroSiege = numeroSiege;
//    }
//
//    public String getStatut() {
//        return statut;
//    }
//
//    public void setStatut(String statut) {
//        this.statut = statut;
//    }
//
//    public Double getMontantPaye() {
//        return montantPaye;
//    }
//
//    public void setMontantPaye(Double montantPaye) {
//        this.montantPaye = montantPaye;
//    }
//
//    public Double getMontantCommission() {
//        return montantCommission;
//    }
//
//    public void setMontantCommission(Double montantCommission) {
//        this.montantCommission = montantCommission;
//    }
//
//    public Double getPartAgence() {
//        return partAgence;
//    }
//
//    public void setPartAgence(Double partAgence) {
//        this.partAgence = partAgence;
//    }
//
//    public String getCodeTicket() {
//        return codeTicket;
//    }
//
//    public void setCodeTicket(String codeTicket) {
//        this.codeTicket = codeTicket;
//    }
//
//
//    public void setClient(User client) {
//        this.client = client;
//    }
//
//    // --- Double compatibilité à la sérialisation JSON ---
//    // Cela force Jackson à générer une clé "client" dans le JSON
//    @JsonProperty("client")
//    public User getClient() {
//        return this.client;
//    }
//
//    // Cela force Jackson à générer AUSSI une clé "user" dupliquée dans le JSON
//    @JsonProperty("user")
//    public User getUser() {
//        return this.client;
//    }
//
//    @JsonProperty("user")
//    public void setUser(User user) {
//        this.client = user;
//    }
//
//    public Trajet getTrajet() {
//        return trajet;
//    }
//
//    public void setTrajet(Trajet trajet) {
//        this.trajet = trajet;
//    }
//
//    public Vehicule getVehicule() {
//        return vehicule;
//    }
//
//    public void setVehicule(Vehicule vehicule) {
//        this.vehicule = vehicule;
//    }
//    public void setReferencePaiement(String caisse) {
//    }
//
//
//}

package com.example.gariconnectbackend.model;

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

    private String statut;
    private Double montantPaye;

    // --- DÉTAILS FINANCIERS ---
    private Double montantCommission;
    private Double partAgence;

    // --- SÉCURITÉ & TICKETS ---
    @Column(name = "code_ticket")
    @JsonProperty("code_ticket")
    private String codeTicket;

    @ManyToOne(cascade = CascadeType.MERGE)
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"reservations", "password"})
    private User client;

    @ManyToOne
    @JoinColumn(name = "trajet_id")
    private Trajet trajet;

    @ManyToOne
    @JoinColumn(name = "vehicule_id")
    private Vehicule vehicule;

    // 🛑 CORRECTION : FetchType.EAGER est OBLIGATOIRE pour inclure le surplus VIP dans la réponse JSON de l'agence
    @OneToOne(mappedBy = "reservation", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonProperty("demande_recuperation")
    @JsonIgnoreProperties("reservation")
    private DemandeRecuperation demandeRecuperation;

    // 💵 CALCUL DYNAMIQUE DU MONTANT TOTAL (Billet + VIP)
    @Transient
    @JsonProperty("montant_total")
    public Double getMontantTotal() {
        Double prixBase = 0.0;

        // 1. Prix de base : Si déjà payé ou partiellement payé, sinon prix officiel du trajet
        if (this.montantPaye != null && this.montantPaye > 0) {
            prixBase = this.montantPaye;
        } else if (this.trajet != null && this.trajet.getPrix() != null) {
            prixBase = this.trajet.getPrix();
        }

        // 2. Ajout du supplément de récupération (VIP)
        if (this.demandeRecuperation != null && this.demandeRecuperation.getPrixSupplementaire() != null) {
            prixBase += this.demandeRecuperation.getPrixSupplementaire();
        }

        return prixBase;
    }

    // --- Compatibilité JSON Frontend ---
    @JsonProperty("client")
    public User getClient() {
        return this.client;
    }

    @JsonProperty("user")
    public User getUser() {
        return this.client;
    }

    @JsonProperty("user")
    public void setUser(User user) {
        this.client = user;
    }
}