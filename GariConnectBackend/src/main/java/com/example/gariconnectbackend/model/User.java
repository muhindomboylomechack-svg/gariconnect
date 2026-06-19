//package com.example.gariconnectbackend.model;
//
//import jakarta.persistence.*;
//        import lombok.*;
//        import java.time.LocalDateTime;
//import java.util.List;
//import com.fasterxml.jackson.annotation.JsonProperty;
//import com.fasterxml.jackson.annotation.JsonIgnore;
//import jakarta.persistence.Column;
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
//    @JsonProperty(value = "password", access = JsonProperty.Access.WRITE_ONLY)
//    @Column(name = "mot_de_passe", nullable = false)
//    private String password;
//
//    // ... vos autres propriétés comme le téléphone, rôle, etc.
//    private String telephone;
//
//
//
//   //  private String password;
//
//    // ...
//    private String codeAcces;
//    private String statut;
//    private String nom;
//    private String prenom;
//
//
//    private String numeroAirtel;
//    private String nomAirtel;
//    private String numeroMpesa;
//    private String nomMpesa;
//    private String numeroOrange;
//    private String nomOrange;
//
//    @Enumerated(EnumType.STRING)
//    private Role role;
//
//    @Column(name = "taux_commission")
//    private Double tauxCommission = 10.0;
//
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "agence_id")
//    private User agenceEmployeur;
//
//    @ManyToOne
//    private Trajet trajet;
//
//    @Column(name = "date_inscription")
//    private LocalDateTime dateInscription;
//
//    @Column(name = "must_change_password", nullable = false)
//    private Boolean mustChangePassword = false;
//    // --- GESTION DE L'ABONNEMENT SAAS ---
//    // Valeurs possibles : "COMMISSION" (par défaut) ou "DEFINITIF" (exempté)
//    @Column(name = "type_abonnement")
//    private String typeAbonnement = "COMMISSION";
//    // ✅ SOLUTION BOUCLE INFINIE : On ignore cette liste lors de la conversion JSON
//    @OneToMany(mappedBy = "destinataire")
//    @JsonIgnore
//    private List<Notification> notifications;
//    @PrePersist
//    protected void onCreate() {
//        this.dateInscription = LocalDateTime.now();
//
//        // Sécurité : si la valeur est toujours null juste avant l'insertion, on la force
//        if (this.mustChangePassword == null) {
//            this.mustChangePassword = false; // Par défaut false, sauf si on a dit true explicitement comme ci-dessus
//        }
//    }
//    // À AJOUTER :
//    @Column(name = "photo_url")
//    private String photoUrl;
//
//    // Ajoutez son getter/setter si vous n'utilisez pas Lombok @Getter @Setter sur toute la classe :
//    public String getPhotoUrl() { return photoUrl; }
//    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
//// ... (reste de ta classe User)
//
//    // ... (reste de votre classe User.java au-dessus)
//
//    public String getNom() { return nom; }
//    public void setNom(String nom) { this.nom = nom; }
//
//    public String getPrenom() { return prenom; }
//    public void setPrenom(String prenom) { this.prenom = prenom; }
//
//    // ====================================================================
//    // 🔥 AJOUTEZ CES DEUX MÉTHODES POUR FIXER LE NUMÉRO DE TÉLÉPHONE
//    // ====================================================================
//    public String getTelephone() { return telephone; }
//    public void setTelephone(String telephone) { this.telephone = telephone; }
//    // ====================================================================
//
//    public LocalDateTime getDateInscription() {
//        return dateInscription;
//    }
//
//    public void setDateInscription(LocalDateTime dateInscription) {
//        this.dateInscription = dateInscription;
//    }
//
//    public Double getTauxCommission() { return tauxCommission; }
//    public void setTauxCommission(Double tauxCommission) { this.tauxCommission = tauxCommission; }
//}

package com.example.gariconnectbackend.model;

import jakarta.persistence.*;
        import lombok.*;
        import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;

@Entity
@Table(name = "users")
@Getter @Setter
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

    private String numeroAirtel;
    private String nomAirtel;
    private String numeroMpesa;
    private String nomMpesa;
    private String numeroOrange;
    private String nomOrange;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Column(name = "taux_commission")
    private Double tauxCommission = 10.0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agence_id")
    private User agenceEmployeur;

    @ManyToOne
    private Trajet trajet;

    @Column(name = "date_inscription")
    private LocalDateTime dateInscription;

    @Column(name = "must_change_password", nullable = false)
    private Boolean mustChangePassword = false;

    // --- GESTION DE L'ABONNEMENT SAAS ---
    // On enlève la valeur par défaut en dur ici pour éviter qu'elle ne s'applique à tout le monde
    @Column(name = "type_abonnement")
    private String typeAbonnement;

    // ✅ SOLUTION BOUCLE INFINIE : On ignore cette liste lors de la conversion JSON
    @OneToMany(mappedBy = "destinataire")
    @JsonIgnore
    private List<Notification> notifications;

    @Column(name = "photo_url")
    private String photoUrl;

    // --- MÉTHODE EXÉCUTÉE JUSTE AVANT L'INSERTION EN BDD ---
    @PrePersist
    protected void onCreate() {
        this.dateInscription = LocalDateTime.now();

        // Sécurité : si la valeur est toujours null juste avant l'insertion, on la force
        if (this.mustChangePassword == null) {
            this.mustChangePassword = false;
        }

        // 🚀 CORRECTION LOGIQUE SAAS :
        // Seules les Agences (AGENCY_ADMIN) reçoivent le statut "COMMISSION" par défaut à la création.
        // Les autres utilisateurs (Clients, Chauffeurs, Managers) garderont la valeur NULL
        if (this.role == Role.AGENCY_ADMIN && this.typeAbonnement == null) {
            this.typeAbonnement = "COMMISSION";
        }
    }

    // --- GETTERS & SETTERS ADDITIONNELS (Si tu ne fais pas confiance à Lombok à 100%) ---
    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }

    public LocalDateTime getDateInscription() { return dateInscription; }
    public void setDateInscription(LocalDateTime dateInscription) { this.dateInscription = dateInscription; }

    public Double getTauxCommission() { return tauxCommission; }
    public void setTauxCommission(Double tauxCommission) { this.tauxCommission = tauxCommission; }
}