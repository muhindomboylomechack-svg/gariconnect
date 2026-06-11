package com.example.gariconnectbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CotationRequest {

    private String pointRepereAgence;

    // 🔥 Sécurité : Utilisation de l'objet "Double" (majuscule) à la place du primitif "double"
    // Cela empêche Spring de renvoyer un crash automatique 400 si le champ arrive vide ou nul.
    private Double distanceEstimee;

    private Double prixSupplementaire;
}