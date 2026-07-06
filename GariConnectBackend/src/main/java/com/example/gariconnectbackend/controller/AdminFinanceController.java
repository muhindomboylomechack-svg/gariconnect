package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.dto.AdminFinanceDTO;
import com.example.gariconnectbackend.model.*;
import com.example.gariconnectbackend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/finances")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@CrossOrigin("*")
public class AdminFinanceController {

    @Autowired private CommissionDetteRepository commissionRepo;
    @Autowired private UserRepository userRepository;
    @Autowired private PaiementRepository paiementRepository;
    @Autowired private ReservationRepository reservationRepository;
    // Ajoutez ces injections en haut de votre classe AdminFinanceController
    @Autowired private NotificationRepository notificationRepository;



    // 1. Petite classe interne pour capturer le JSON de React proprement
    static class ReglementPayload {
        private String agence;
        private Double montant;

        public String getAgence() { return agence; }
        public void setAgence(String agence) { this.agence = agence; }
        public Double getMontant() { return montant; }
        public void setMontant(Double montant) { this.montant = montant; }
    }



    @GetMapping("/resume-commissions")
    public ResponseEntity<?> getResumeCommissions() {
        List<User> agences = userRepository.findByRole(Role.AGENCY_ADMIN); // Corrigé sur AGENCY_ADMIN
        List<Map<String, Object>> resume = new ArrayList<>();

        for (User agence : agences) {
            Double resteAPayer = commissionRepo.totalDuRestantParAgence(agence.getId());
            Double ventesBrutes = commissionRepo.sumVentesBrutesParAgence(agence.getId());

            Map<String, Object> map = new HashMap<>();
            map.put("partenaire", agence.getNom() != null ? agence.getNom() : "Agence " + agence.getId());
            map.put("volumeVentes", ventesBrutes != null ? ventesBrutes : 0.0);
            map.put("commissionNet", resteAPayer != null ? resteAPayer : 0.0);

            resume.add(map);
        }
        return ResponseEntity.ok(resume);
    }
    @GetMapping({"/stats-globales", "/dashboard-stats"})
    public ResponseEntity<AdminFinanceDTO> getStatsGlobales() {
        // 1. Volume total d'affaires
        Double volumeTotal = paiementRepository.sumMontantByStatutIn(List.of("SUCCES", "EN_ATTENTE_CAISSE"));
        if (volumeTotal == null) volumeTotal = 0.0;

        // 2. Revenus GariConnect Net (Somme des commissions reçues/dues)
        Double revenusNet = commissionRepo.sumTotalDettesEnAttente(); // ou une autre requête globale si nécessaire
        if (revenusNet == null) revenusNet = 0.0;

        // 3. Nombre total d'utilisateurs (tous rôles confondus)
        long totalUsers = userRepository.count();

        // 4. Nombre total de billets/tickets confirmés
        long billetsConfirmes = reservationRepository.countByStatutPaiement("PAYE");

        // 5. 🔥 MODIFICATION : Nombre total de Tenants Partenaires (AGENCY_ADMIN)
        long totalAgences = userRepository.countByRole(Role.AGENCY_ADMIN);

        // 6. Nombre d'agences actives (ayant au moins une activité ou statut ACTIF)
        long activeAgences = userRepository.findByRoleAndStatut(Role.AGENCY_ADMIN, "ACTIF").size();

        // --- Construction du DTO ---
        AdminFinanceDTO dto = new AdminFinanceDTO();
        dto.setVolumeAffairesTotal(volumeTotal);
        dto.setRevenusGariConnectNet(revenusNet);
        dto.setTotalUsers(totalUsers);
        dto.setBilletsConfirmes(billetsConfirmes);
        dto.setTotalAgences(totalAgences); // Injection du nombre total de tenants
        dto.setActiveAgences(activeAgences);

        // 7. Détails par agence (Calcul des dettes/commissions par agence)
        List<User> agences = userRepository.findByRole(Role.AGENCY_ADMIN);
        List<Map<String, Object>> detailParAgence = new ArrayList<>();

        for (User agence : agences) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", agence.getId());
            map.put("nom", agence.getNom());

            Double totalDu = commissionRepo.totalDuParAgence(agence.getId());
            Double totalRegle = commissionRepo.totalRegleParAgence(agence.getId());

            map.put("totalDu", totalDu != null ? totalDu : 0.0);
            map.put("totalRegle", totalRegle != null ? totalRegle : 0.0);
            detailParAgence.add(map);
        }
        dto.setDetailParAgence(detailParAgence);

        // 8. Données de graphe fictives ou réelles (Exemple basé sur les 5 derniers règlements)
        List<Map<String, Object>> chartData = new ArrayList<>();
        // Remplir chartData ici si nécessaire...
        dto.setChartData(chartData);

        // 9. Activités récentes (Exemple : liste des derniers règlements ou inscriptions)
        List<Map<String, Object>> recentActivities = new ArrayList<>();
        // Remplir recentActivities ici si nécessaire...
        dto.setRecentActivities(recentActivities);

        return ResponseEntity.ok(dto);
    }


    @PostMapping("/regler")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> effectuerReglement(@RequestBody Map<String, Object> request) {
        try {
            String nomAgence = (String) request.get("agence");
            Double montantRecu = Double.valueOf(request.get("montant").toString());

            User agence = userRepository.findByNom(nomAgence)
                    .orElseThrow(() -> new RuntimeException("Agence non trouvée"));

            List<CommissionDette> dettes = commissionRepo.findByAgenceAndRegleeOrderByIdAsc(agence, false);

            Double resteAVerser = montantRecu;
            Double montantTotalRegle = 0.0;

            for (CommissionDette dette : dettes) {
                if (resteAVerser <= 0) break;

                Double duSurCetteLigne = (dette.getMontantDu() != null) ? dette.getMontantDu() : dette.getMontant();

                if (resteAVerser >= duSurCetteLigne) {
                    resteAVerser -= duSurCetteLigne;
                    dette.setMontantDu(0.0);
                    dette.setReglee(true);
                    montantTotalRegle += duSurCetteLigne;
                } else {
                    dette.setMontantDu(duSurCetteLigne - resteAVerser);
                    montantTotalRegle += resteAVerser;
                    resteAVerser = 0.0;
                }
                commissionRepo.save(dette);
            }

            if (montantTotalRegle > 0) {
                Notification notifAgence = new Notification();
                notifAgence.setDestinataire(agence);
                notifAgence.setMessage("💰 GariConnect Admin : Nous avons bien reçu et validé votre règlement de commission d'un montant de " + montantTotalRegle + " USD. Merci !");
                notifAgence.setDate(LocalDateTime.now());
                notifAgence.setLue(false);
                notificationRepository.save(notifAgence);
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Règlement effectué avec succès !",
                    "montantTraite", montantTotalRegle
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
