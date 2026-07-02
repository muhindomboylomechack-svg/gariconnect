package com.example.gariconnectbackend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "vehicules")
@Getter @Setter
@NoArgsConstructor  // 🔥 INDISPENSABLE POUR JACKSON
@AllArgsConstructor
public class Vehicule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "plaque_immatriculation")
    private String plaque_immatriculation;

    private String marque;
    private String modele;
    private Integer capacite;

    private Double latitude;
    private Double longitude;

    @Column(name = "capacite_totale")
    @JsonProperty("capaciteTotale")
    private Integer capaciteTotale;

    private String statut;
    @ManyToOne
    @JoinColumn(name = "trajet_id")
    private Trajet trajet;
    // LIEN DE PARENTÉ : Le bus appartient à une agence
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "agence_id", nullable = false)
    private User agence;
    public User getAgence() { return agence; }
    public void setAgence(User agence) { this.agence = agence; }

    public String getMarque() {
        return marque;
    }

    public void setMarque(String marque) {
        this.marque = marque;
    }

    public String getModele() {
        return modele;
    }

    public void setModele(String modele) {
        this.modele = modele;
    }

    public Integer getCapacite() {
        return capacite;
    }

    public void setCapacite(Integer capacite) {
        this.capacite = capacite;
    }

    public Integer getCapaciteTotale() {
        return capaciteTotale;
    }

    public void setCapaciteTotale(Integer capaciteTotale) {
        this.capaciteTotale = capaciteTotale;
    }

    public String getStatut() {
        return statut;
    }

    public void setStatut(String statut) {
        this.statut = statut;
    }
}
