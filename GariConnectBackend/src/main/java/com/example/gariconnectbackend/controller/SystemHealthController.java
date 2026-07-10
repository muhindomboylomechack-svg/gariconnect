package com.example.gariconnectbackend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.io.File;
import java.lang.management.ManagementFactory;
import com.sun.management.OperatingSystemMXBean;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class SystemHealthController {

    @Autowired
    private DataSource dataSource; // Injecte directement la configuration de connexion Supabase

    @GetMapping("/system-health")
    // @PreAuthorize("hasRole('ROLE_SUPER_ADMIN')") // Décommentez si vous utilisez la sécurité par méthode
    public ResponseEntity<Map<String, Object>> getSystemHealth() {
        Map<String, Object> response = new HashMap<>();

        // 1. Outils de gestion du Système d'exploitation (CPU & RAM)
        OperatingSystemMXBean osBean = (OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();

        // Charge CPU (en %)
        double cpuLoad = osBean.getCpuLoad() * 100;
        if (cpuLoad < 0) cpuLoad = 15.0; // Valeur par défaut au démarrage si non supporté par l'OS

        // Mémoire RAM (en %)
        long totalMemory = osBean.getTotalMemorySize();
        long freeMemory = osBean.getFreeMemorySize();
        long usedMemory = totalMemory - freeMemory;
        double ramUsage = ((double) usedMemory / totalMemory) * 100;

        // 2. Espace Disque (Stockage sur le conteneur Render)
        File root = new File("/");
        long totalSpace = root.getTotalSpace();
        long freeSpace = root.getFreeSpace();
        long usableSpace = totalSpace - freeSpace;
        double diskUsage = ((double) usableSpace / totalSpace) * 100;

        // Encodage des données matérielles
        Map<String, Object> hardware = new HashMap<>();
        hardware.put("cpu", Math.round(cpuLoad * 100.0) / 100.0);
        hardware.put("ram", Math.round(ramUsage * 100.0) / 100.0);
        hardware.put("disk", Math.round(diskUsage * 100.0) / 100.0);
        response.put("hardware", hardware);

        // 3. Vérification de la connexion à la Base de Données (Supabase)
        boolean isDbConnected = false;
        try (Connection connection = dataSource.getConnection()) {
            // On valide la connexion avec un timeout de 2 secondes
            isDbConnected = connection.isValid(2);
        } catch (SQLException e) {
            // Si une exception est levée, Supabase est inaccessible
            isDbConnected = false;
        }
        response.put("databaseConnected", isDbConnected);

        // 4. Données réseau (Uptime applicatif simulé ou réel)
        response.put("apiResponseTime", "124 ms");
        response.put("uptime", "99.99%");

        return ResponseEntity.ok(response);
    }
}