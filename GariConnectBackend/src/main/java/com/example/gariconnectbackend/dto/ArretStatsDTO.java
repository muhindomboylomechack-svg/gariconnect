package com.example.gariconnectbackend.dto;

import jdk.jshell.Snippet;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor // Génère les getters, setters, toString, equals et hashCode
@Builder              // 🛠️ CORRECTION : Permet d'utiliser ArretStatsDTO.builder()

public class ArretStatsDTO {
    private Long id;
    private String nom;
    private Double latitude;
    private Double longitude;
    private Integer capaciteMaximale;

    private Integer nombrePassagersEnAttente;
    // Le nombre de personnes actuellement "EN_ATTENTE_A_L_ARRET"
    private long passagersEnAttente;

}
