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

    @GetMapping({"/stats-globales", "/dashboard-stats"})
    public ResponseEntity<AdminFinanceDTO> getStatsGlobales() {
        // 1. Volume total d'affaires
        Double volumeTotal = paiementRepository.sumMontantByStatutIn(List.of("SUCCES", "EN_ATTENTE_CAISSE"));
        if (volumeTotal == null) volumeTotal = 0.0;

        // 2. Reste total à percevoir (Somme des montants restants)
        Double resteAPercevoirTotal = commissionRepo.sumTotalDettesEnAttente();
        if (resteAPercevoirTotal == null) resteAPercevoirTotal = 0.0;

        // 3. Statistiques utilisateurs
        long totalUsers = userRepository.count();
        long activeAgences = userRepository.countByRole(Role.AGENCY_MANAGER);

        // 4. Construction de la liste par agence
        List<User> agences = userRepository.findByRole(Role.AGENCY_MANAGER);
        List<Map<String, Object>> detailParAgence = agences.stream().map(agence -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", agence.getId());
            map.put("nom", agence.getNom());

            // Ventes Brutes
            Double ventes = commissionRepo.sumVentesBrutesParAgence(agence.getId());
            map.put("ventesBrutes", ventes != null ? ventes : 0.0);

            // Commission à payer (On affiche le montant restant)
            Double commissionRestante = commissionRepo.totalDuRestantParAgence(agence.getId());
            map.put("commissionTotale", commissionRestante != null ? commissionRestante : 0.0);

            return map;
        }).collect(Collectors.toList());

        AdminFinanceDTO dto = new AdminFinanceDTO();
        dto.setVolumeAffairesTotal(volumeTotal);
        dto.setRevenusGariConnectNet(resteAPercevoirTotal);
        dto.setTotalUsers(totalUsers);
        dto.setActiveAgences(activeAgences);
        dto.setDetailParAgence(detailParAgence);

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/resume-commissions")
    public ResponseEntity<?> getResumeCommissions() {
        List<User> agences = userRepository.findByRole(Role.AGENCY_MANAGER);
        List<Map<String, Object>> resume = new ArrayList<>();

        for (User agence : agences) {
            // ON RÉCUPÈRE LE SOLDE RESTANT (Le 15 000 FC)
            Double resteAPayer = commissionRepo.totalDuRestantParAgence(agence.getId());
            Double ventesBrutes = commissionRepo.sumVentesBrutesParAgence(agence.getId());

            Map<String, Object> map = new HashMap<>();
            map.put("partenaire", agence.getNom());
            map.put("volumeVentes", ventesBrutes != null ? ventesBrutes : 0.0);
            // C'est cette valeur que le React affiche
            map.put("commissionNet", resteAPayer != null ? resteAPayer : 0.0);

            resume.add(map);
        }
        return ResponseEntity.ok(resume);
    }

    // 1. Petite classe interne pour capturer le JSON de React proprement
    static class ReglementPayload {
        private String agence;
        private Double montant;

        public String getAgence() { return agence; }
        public void setAgence(String agence) { this.agence = agence; }
        public Double getMontant() { return montant; }
        public void setMontant(Double montant) { this.montant = montant; }
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
            Double montantTotalRegle = 0.0; // Pour calculer le montant exact traité

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

            // ✅ NOUVEAU : Envoi de la notification à l'agence
            if (montantTotalRegle > 0) {
                Notification notifAgence = new Notification();
                notifAgence.setDestinataire(agence);
                notifAgence.setMessage("💰 GariConnect Admin : Nous avons bien reçu et validé votre règlement de commission d'un montant de " + montantTotalRegle + " USD. Merci !");
                notifAgence.setDate(LocalDateTime.now());
                notifAgence.setLue(false);
                notificationRepository.save(notifAgence);
                System.out.println("✅ Notification de règlement envoyée à l'agence : " + agence.getNom());
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
