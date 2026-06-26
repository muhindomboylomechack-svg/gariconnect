package com.example.gariconnectbackend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "trajets")
@Getter
@Setter
@AllArgsConstructor
public class Trajet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String depart;
    private String destination;
    private LocalDateTime dateHeureDepart;
    private String joursSemaine;
    private Double prix;

    @Column(name = "places_disponibles")
    @JsonProperty("placesDisponibles")
    private Integer placesDisponibles;

    private Double latitudeActuelle;
    private Double longitudeActuelle;
    private String statut;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

//    @ManyToOne
//    @JoinColumn(name = "chauffeur_id")
//    @JsonIgnoreProperties({"trajets", "password", "email", "agenceEmployeur"})
//    private User chauffeur;
//
//    @ManyToOne
//    @JoinColumn(name = "agence_id")
//    @JsonIgnoreProperties({"trajets", "password", "vehicules", "chauffeurs"})
//    private User agence;
    @ManyToOne
    @JoinColumn(name = "agence_id")
    @JsonIgnoreProperties({"trajets", "password", "agenceEmployeur"}) // Empêche Jackson de boucler sur ces champs de l'User
    private User agence;

    @ManyToOne
    @JoinColumn(name = "chauffeur_id")
    @JsonIgnoreProperties({"trajets", "password", "agenceEmployeur"}) // Empêche également la boucle ici
    private User chauffeur;
    @ManyToOne
    @JoinColumn(name = "vehicule_id")
    @JsonIgnoreProperties({"trajets", "agence"})
    private Vehicule vehicule;
    // Constructeur par défaut indispensable pour Jackson / Hibernate
    public Trajet() {
    }
    // 🟢 NOUVEAU : Un trajet dessert une liste d'arrêts
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "trajet_arrets",
            joinColumns = @JoinColumn(name = "trajet_id"),
            inverseJoinColumns = @JoinColumn(name = "arret_bus_id")
    )
    private List<ArretBus> arrets;
    // --- GETTERS ET SETTERS MANUELS (Pour éviter les erreurs de compilation) ---

    public LocalDateTime getDateHeureDepart() {
        return dateHeureDepart;
    }

    public void setDateHeureDepart(LocalDateTime dateHeureDepart) {
        this.dateHeureDepart = dateHeureDepart;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    @JsonProperty("label")
    public String getLabel() {
        if (depart == null || destination == null) return "Trajet non défini";
        return depart + " → " + destination;
    }

    // À vérifier/ajouter dans votre classe Trajet.java
    public void addArret(ArretBus arret) {
        if (this.arrets == null) {
            this.arrets = new java.util.ArrayList<>();
        }
        this.arrets.add(arret);
        if (arret.getTrajets() == null) {
            arret.setTrajets(new java.util.ArrayList<>());
        }
        arret.getTrajets().add(this);
    }
}