package com.example.gariconnectbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AgenceDashboardDTO {
    private long nbVehicules;
    private long nbTrajets;
    private long nbReservations;
    private Double revenuTotal; // Ce que nous allons calculer
    private long effectifPersonnel;
    private List<Map<String, Object>> hebdomadaireData; // Pour le graphique bleu
}
