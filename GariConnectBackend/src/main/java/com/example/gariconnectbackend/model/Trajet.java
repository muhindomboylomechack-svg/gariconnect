package com.example.gariconnectbackend.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
@Entity
@Table(name = "trajets")
@Getter
@Setter
@NoArgsConstructor  // 🔥 Indispensable pour Jackson (génère le constructeur vide proprement)
@AllArgsConstructor // Génère le constructeur avec tous les arguments
@JsonIgnoreProperties(ignoreUnknown = true)
public class Trajet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String depart;
    private String destination;
    //private LocalDateTime dateHeureDepart;
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
    @JoinColumn(name = "agence_id")
    @JsonIgnoreProperties({"trajets", "password", "agenceEmployeur"})
    private User agence;

    @ManyToOne
    @JoinColumn(name = "chauffeur_id")
    @JsonIgnoreProperties({"trajets", "password", "agenceEmployeur"})
    private User chauffeur;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime dateHeureDepart;
    @ManyToOne
    @JoinColumn(name = "vehicule_id")
    @JsonIgnoreProperties({"trajets", "agence"})
    private Vehicule vehicule;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "trajet_arrets",
            joinColumns = @JoinColumn(name = "trajet_id"),
            inverseJoinColumns = @JoinColumn(name = "arret_bus_id")
    )
    private List<ArretBus> arrets = new ArrayList<>();


    // N'oubliez pas le getter et le setter si vous n'utilisez pas Lombok (@Data)
    public Integer getPlacesDisponibles() {
        return placesDisponibles;
    }

    public void setPlacesDisponibles(Integer placesDisponibles) {
        this.placesDisponibles = placesDisponibles;
    }
    @JsonProperty("label")
    public String getLabel() {
        if (depart == null || destination == null) return "Trajet non défini";
        return depart + " → " + destination;
    }

    public void addArret(ArretBus arret) {
        if (this.arrets == null) {
            this.arrets = new ArrayList<>();
        }
        this.arrets.add(arret);
        if (arret.getTrajets() == null) {
            arret.setTrajets(new ArrayList<>());
        }
        arret.getTrajets().add(this);
    }
}