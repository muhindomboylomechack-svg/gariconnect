package com.example.gariconnectbackend.model;

import jakarta.persistence.*;
        import lombok.*;
        import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;

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

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    private String codeAcces;
    private String statut;
    private String nom;
    private String prenom;
    private String telephone;

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

    // ✅ SOLUTION BOUCLE INFINIE : On ignore cette liste lors de la conversion JSON
    @OneToMany(mappedBy = "destinataire")
    @JsonIgnore
    private List<Notification> notifications;

    @PrePersist
    protected void onCreate() {
        this.dateInscription = LocalDateTime.now();
    }
    // --- GETTERS ET SETTERS MANUELS (Sécurité si Lombok ne compile pas) ---
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public Double getTauxCommission() { return tauxCommission; }
    public void setTauxCommission(Double tauxCommission) { this.tauxCommission = tauxCommission; }

}