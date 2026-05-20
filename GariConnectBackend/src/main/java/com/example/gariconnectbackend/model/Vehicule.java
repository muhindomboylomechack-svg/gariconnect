package com.example.gariconnectbackend.model;

import jakarta.persistence.*;
        import lombok.*;

@Entity
@Table(name = "vehicules")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Vehicule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String plaqueImmatriculation;
    private String marque;
    private String modele;
    private Integer capacite;
    // Dans Vehicule.java, ajoute ce champ :
    private Integer capaciteTotale;

    // N'oublie pas de générer le Getter et le Setter (ou utilise Lombok @Data)
    private String statut; // ex: "DISPONIBLE", "EN_MAINTENANCE"


}
