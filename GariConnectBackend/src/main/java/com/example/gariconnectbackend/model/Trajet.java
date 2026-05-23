package com.example.gariconnectbackend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "trajets")
@Getter
@Setter
@NoArgsConstructor
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

    @ManyToOne
    @JoinColumn(name = "chauffeur_id")
    @JsonIgnoreProperties({"trajets", "password", "email", "agenceEmployeur"})
    private User chauffeur;

    @ManyToOne
    @JoinColumn(name = "agence_id")
    @JsonIgnoreProperties({"trajets", "password", "vehicules", "chauffeurs"})
    private User agence;

    @ManyToOne
    @JoinColumn(name = "vehicule_id")
    @JsonIgnoreProperties({"trajets", "agence"})
    private Vehicule vehicule;

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
}