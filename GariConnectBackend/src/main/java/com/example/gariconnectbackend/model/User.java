package com.example.gariconnectbackend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
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
    // À ajouter à l'intérieur de votre classe User.java :
    public String getNomAgence() {
        return this.nom; // ou return this.nomEntreprise; selon le nom de votre champ
    }
    // ====================================================================
    // 🟢 LIAISON AVEC LES TRAJETS (Pour les Chauffeurs affectés)
    // ====================================================================
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trajet_id")
    private Trajet trajet; // Permet de savoir sur quel trajet un chauffeur est aligné
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
    private Double tauxEchangeCourant = 2800.0; // Valeur par défaut initiale
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
    // 🟢 GETTERS & SETTERS MANUELS (Sécurité absolue pour ton UserController)
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

    // Setters & Getters requis par ton controlleur :
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
////package com.example.gariconnectbackend.model;
////
////import jakarta.persistence.*;
////        import lombok.*;
////        import java.time.LocalDateTime;
////import java.util.List;
////import com.fasterxml.jackson.annotation.JsonProperty;
////import com.fasterxml.jackson.annotation.JsonIgnore;
////import jakarta.persistence.Column;
////@Entity
////@Table(name = "users")
////@Getter @Setter
////@NoArgsConstructor
////@AllArgsConstructor
////public class User {
////    @Id
////    @GeneratedValue(strategy = GenerationType.IDENTITY)
////    private Long id;
////
////    @Column(unique = true, nullable = false)
////    private String email;
////    @JsonProperty(value = "password", access = JsonProperty.Access.WRITE_ONLY)
////    @Column(name = "mot_de_passe", nullable = false)
////    private String password;
////
////    // ... vos autres propriétés comme le téléphone, rôle, etc.
////    private String telephone;
////
////
////
////   //  private String password;
////
////    // ...
////    private String codeAcces;
////    private String statut;
////    private String nom;
////    private String prenom;
////
////
////    private String numeroAirtel;
////    private String nomAirtel;
////    private String numeroMpesa;
////    private String nomMpesa;
////    private String numeroOrange;
////    private String nomOrange;
////
////    @Enumerated(EnumType.STRING)
////    private Role role;
////
////    @Column(name = "taux_commission")
////    private Double tauxCommission = 10.0;
////
////    @ManyToOne(fetch = FetchType.LAZY)
////    @JoinColumn(name = "agence_id")
////    private User agenceEmployeur;
////
////    @ManyToOne
////    private Trajet trajet;
////
////    @Column(name = "date_inscription")
////    private LocalDateTime dateInscription;
////
////    @Column(name = "must_change_password", nullable = false)
////    private Boolean mustChangePassword = false;
////    // --- GESTION DE L'ABONNEMENT SAAS ---
////    // Valeurs possibles : "COMMISSION" (par défaut) ou "DEFINITIF" (exempté)
////    @Column(name = "type_abonnement")
////    private String typeAbonnement = "COMMISSION";
////    // ✅ SOLUTION BOUCLE INFINIE : On ignore cette liste lors de la conversion JSON
////    @OneToMany(mappedBy = "destinataire")
////    @JsonIgnore
////    private List<Notification> notifications;
////    @PrePersist
////    protected void onCreate() {
////        this.dateInscription = LocalDateTime.now();
////
////        // Sécurité : si la valeur est toujours null juste avant l'insertion, on la force
////        if (this.mustChangePassword == null) {
////            this.mustChangePassword = false; // Par défaut false, sauf si on a dit true explicitement comme ci-dessus
////        }
////    }
////    // À AJOUTER :
////    @Column(name = "photo_url")
////    private String photoUrl;
////
////    // Ajoutez son getter/setter si vous n'utilisez pas Lombok @Getter @Setter sur toute la classe :
////    public String getPhotoUrl() { return photoUrl; }
////    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
////// ... (reste de ta classe User)
////
////    // ... (reste de votre classe User.java au-dessus)
////
////    public String getNom() { return nom; }
////    public void setNom(String nom) { this.nom = nom; }
////
////    public String getPrenom() { return prenom; }
////    public void setPrenom(String prenom) { this.prenom = prenom; }
////
////    // ====================================================================
////    // 🔥 AJOUTEZ CES DEUX MÉTHODES POUR FIXER LE NUMÉRO DE TÉLÉPHONE
////    // ====================================================================
////    public String getTelephone() { return telephone; }
////    public void setTelephone(String telephone) { this.telephone = telephone; }
////    // ====================================================================
////
////    public LocalDateTime getDateInscription() {
////        return dateInscription;
////    }
////
////    public void setDateInscription(LocalDateTime dateInscription) {
////        this.dateInscription = dateInscription;
////    }
////
////    public Double getTauxCommission() { return tauxCommission; }
////    public void setTauxCommission(Double tauxCommission) { this.tauxCommission = tauxCommission; }
//package com.example.gariconnectbackend.model;
//
//import jakarta.persistence.*;
//import lombok.*;
//import java.time.LocalDateTime;
//import com.fasterxml.jackson.annotation.JsonProperty;
//
//@Entity
//@Table(name = "users")
//@Getter @Setter
//@NoArgsConstructor
//@AllArgsConstructor
//public class User {
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    private Long id;
//
//    @Column(unique = true, nullable = false)
//    private String email;
//
//    @JsonProperty(value = "password", access = JsonProperty.Access.WRITE_ONLY)
//    @Column(name = "mot_de_passe", nullable = false)
//    private String password;
//
//    private String telephone;
//    private String codeAcces;
//    private String statut;
//    private String nom;
//    private String prenom;
//
//    @Enumerated(EnumType.STRING)
//    private Role role;
//
//    private Boolean mustChangePassword;
//    private LocalDateTime dateInscription;
//    private String typeAbonnement;
//    private String photoUrl;
//    // 🟢 CORRECTION : Le type doit être User (car une agence est un User de rôle AGENCY_ADMIN)
//    @ManyToOne(fetch = FetchType.EAGER)
//    @JoinColumn(name = "agence_id")
//    private User agenceEmployeur;
//
//    // Propriété temporaire pour mapper l'ID reçu du formulaire frontend
//    @Transient
//    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
//    private Long agenceId;
//
//
//    @PrePersist
//    protected void onCreate() {
//        this.dateInscription = LocalDateTime.now();
//        if (this.statut == null || this.statut.trim().isEmpty()) {
//            this.statut = "ACTIF";
//        }
//        if (this.mustChangePassword == null) {
//            this.mustChangePassword = false;
//        }
//        if (this.role == Role.AGENCY_ADMIN && this.typeAbonnement == null) {
//            this.typeAbonnement = "COMMISSION";
//        }
//    }
//
//    // --- GETTERS & SETTERS ADDITIONNELS MANUELS EN CAS DE BESOIN ---
//    public String getPhotoUrl() { return photoUrl; }
//    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
//    public String getNom() { return nom; }
//    public void setNom(String nom) { this.nom = nom; }
//    public String getPrenom() { return prenom; }
//    public void setPrenom(String prenom) { this.prenom = prenom; }
//    public String getTelephone() { return telephone; }
//    public void setTelephone(String telephone) { this.telephone = telephone; }
//    public LocalDateTime getDateInscription() { return dateInscription; }
//    public void setDateInscription(LocalDateTime dateInscription) { this.dateInscription = dateInscription; }
//}
