package com.example.gariconnectbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@AllArgsConstructor
public class AdminFinanceDTO {

    private Double volumeAffairesTotal;    // Carte 1 : Volume d'affaires
    private Double revenusGariConnectNet; // Carte 2 : Somme des commissions (Gains Admin)
    private Long billetsConfirmes;        // Carte 4 : Nombre de tickets
    private long totalUsers;               // Carte 3 : Nombre total d'utilisateurs
    private long activeAgences;
    private long totalAgences;
    private List<Map<String, Object>> detailParAgence;
    private List<Map<String, Object>> chartData;
    private List<Map<String, Object>> recentActivities;
    private List<Map<String, Object>> paymentMethodsData;

    // Constructeur vide obligatoire pour Jackson (Le conflit avec @NoArgsConstructor est résolu)
    public AdminFinanceDTO() {}

    // --- GETTERS ET SETTERS EXPLICITES (Garantie Anti-Zéro Réseau) ---

    public Double getVolumeAffairesTotal() {
        return volumeAffairesTotal;
    }
    public void setVolumeAffairesTotal(Double volumeAffairesTotal) {
        this.volumeAffairesTotal = volumeAffairesTotal;
    }

    public Double getRevenusGariConnectNet() {
        return revenusGariConnectNet;
    }
    public void setRevenusGariConnectNet(Double revenusGariConnectNet) {
        this.revenusGariConnectNet = revenusGariConnectNet;
    }

    public Long getBilletsConfirmes() {
        return billetsConfirmes;
    }
    public void setBilletsConfirmes(Long billetsConfirmes) {
        this.billetsConfirmes = billetsConfirmes;
    }

    public long getTotalUsers() {
        return totalUsers;
    }
    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getActiveAgences() {
        return activeAgences;
    }
    public void setActiveAgences(long activeAgences) {
        this.activeAgences = activeAgences;
    }

    public long getTotalAgences() {
        return totalAgences;
    }
    public void setTotalAgences(long totalAgences) {
        this.totalAgences = totalAgences;
    }

    public List<Map<String, Object>> getDetailParAgence() {
        return detailParAgence;
    }
    public void setDetailParAgence(List<Map<String, Object>> detailParAgence) {
        this.detailParAgence = detailParAgence;
    }

    public List<Map<String, Object>> getChartData() {
        return chartData;
    }
    public void setChartData(List<Map<String, Object>> chartData) {
        this.chartData = chartData;
    }

    public List<Map<String, Object>> getRecentActivities() {
        return recentActivities;
    }
    public void setRecentActivities(List<Map<String, Object>> recentActivities) {
        this.recentActivities = recentActivities;
    }

    public List<Map<String, Object>> getPaymentMethodsData() {
        return paymentMethodsData;
    }
    public void setPaymentMethodsData(List<Map<String, Object>> paymentMethodsData) {
        this.paymentMethodsData = paymentMethodsData;
    }
}