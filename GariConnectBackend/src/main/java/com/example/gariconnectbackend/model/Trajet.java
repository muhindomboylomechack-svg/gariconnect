package com.example.gariconnectbackend.model;

import jakarta.persistence.*;
        import lombok.*;
        import java.time.LocalDateTime;

@Entity
@Table(name = "trajets")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Trajet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String depart;
    private String destination;
    private LocalDateTime dateHeureDepart;
    private Double prix;
    // Dans Trajet.java, ajoute ce champ :
    private Integer placesDisponibles;

    // Getters et Setters...
    @ManyToOne
    @JoinColumn(name = "chauffeur_id")
    private User chauffeur;
    // Dans Trajet.java

    @ManyToOne
    @JoinColumn(name = "vehicule_id")
    private Vehicule vehicule;


    // --- AJOUTE CES MÉTHODES ---
    public Vehicule getVehicule() {
        return vehicule;
    }

    public void setVehicule(Vehicule vehicule) {
        this.vehicule = vehicule;
    }

    public Integer getPlacesDisponibles() {
        return placesDisponibles;
    }

    public void setPlacesDisponibles(Integer placesDisponibles) {
        this.placesDisponibles = placesDisponibles;
    }
}