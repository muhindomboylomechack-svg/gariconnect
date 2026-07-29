package com.example.gariconnectbackend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonCreator;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true) // 🟢 Permet à Jackson d'ignorer les champs non envoyés dans le JSON (ex: email, password)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @JsonProperty(value = "password", access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "mot_de_passe", nullable = false)
    private String password;

    private String telephone;
    private String codeAcces;
    private String statut;
    private String nom;
    private String prenom;
    private String photoUrl;

    @Enumerated(EnumType.STRING)
    private Role role;

    private Boolean mustChangePassword;
    private LocalDateTime dateInscription;
    private String typeAbonnement;

    // ====================================================================
    // 🟢 CONSTRUCTEUR POUR DÉSÉRIALISATION JACKSON FACILE (Fix 400 Bad Request)
    // ====================================================================
    @JsonCreator
    public User(@JsonProperty("id") Long id) {
        this.id = id;
    }

    public String getNomAgence() {
        return this.nom;
    }

    // ====================================================================
    // 🟢 LIAISON AVEC LES TRAJETS (Pour les Chauffeurs affectés)
    // ====================================================================
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trajet_id")
    private Trajet trajet;

    // ====================================================================
    // 🟢 ATTRIBUTS FINANCIERS ET LOGIQUE MULTI-TENANT
    // ====================================================================
    private Double tauxCommission;

    // Orange Money
    private String numeroOrange;
    private String nomOrange;

    // M-Pesa
    private String numeroMpesa;
    private String nomMpesa;

    @Column(name = "taux_echange_courant")
    private Double tauxEchangeCourant = 2800.0;

    // Airtel Money
    private String numeroAirtel;
    private String nomAirtel;

    // Liaison Multi-tenant vers l'agence (représentée par un User AGENCY_ADMIN)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "agence_id")
    private User agenceEmployeur;

    @Transient
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Long agenceId;

    @PrePersist
    protected void onCreate() {
        this.dateInscription = LocalDateTime.now();
        if (this.statut == null || this.statut.trim().isEmpty()) {
            this.statut = "ACTIF";
        }
        if (this.mustChangePassword == null) {
            this.mustChangePassword = false;
        }
        if (this.role == Role.AGENCY_ADMIN && this.typeAbonnement == null) {
            this.typeAbonnement = "COMMISSION";
        }
    }

    // ====================================================================
    // 🟢 GETTERS & SETTERS MANUELS
    // ====================================================================
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }

    public LocalDateTime getDateInscription() { return dateInscription; }
    public void setDateInscription(LocalDateTime dateInscription) { this.dateInscription = dateInscription; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public Double getTauxCommission() { return tauxCommission; }
    public void setTauxCommission(Double tauxCommission) { this.tauxCommission = tauxCommission; }

    public String getNumeroOrange() { return numeroOrange; }
    public void setNumeroOrange(String numeroOrange) { this.numeroOrange = numeroOrange; }

    public String getNomOrange() { return nomOrange; }
    public void setNomOrange(String nomOrange) { this.nomOrange = nomOrange; }

    public String getNumeroMpesa() { return numeroMpesa; }
    public void setNumeroMpesa(String numeroMpesa) { this.numeroMpesa = numeroMpesa; }

    public String getNomMpesa() { return nomMpesa; }
    public void setNomMpesa(String nomMpesa) { this.nomMpesa = nomMpesa; }

    public String getNumeroAirtel() { return numeroAirtel; }
    public void setNumeroAirtel(String numeroAirtel) { this.numeroAirtel = numeroAirtel; }

    public String getNomAirtel() { return nomAirtel; }
    public void setNomAirtel(String nomAirtel) { this.nomAirtel = nomAirtel; }
}