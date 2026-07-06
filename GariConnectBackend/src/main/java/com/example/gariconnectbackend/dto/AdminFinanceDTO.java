package com.example.gariconnectbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdminFinanceDTO {
    private Double volumeAffairesTotal;    // Carte 1 : Volume d'affaires
    private Double revenusGariConnectNet; // Carte 2 : Somme des commissions (Gains Admin)
    private Long billetsConfirmes;        // Carte 4 : Nombre de tickets
    private long totalUsers;               // Carte 3 : Nombre total d'utilisateurs
    private long activeAgences;
    private List<Map<String, Object>> detailParAgence;
    private List<Map<String, Object>> chartData;
    private List<Map<String, Object>> recentActivities;
// Tes autres champs existants (volumeTotal, commissions, etc.)...

    private long totalAgences;

    // Getters et Setters
    public long getTotalAgences() {
        return totalAgences;
    }

    public void setTotalAgences(long totalAgences) {
        this.totalAgences = totalAgences;
    }
}