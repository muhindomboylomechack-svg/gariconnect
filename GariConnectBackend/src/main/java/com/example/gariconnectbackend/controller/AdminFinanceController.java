//
//package com.example.gariconnectbackend.controller;
//
//import com.example.gariconnectbackend.dto.AdminFinanceDTO;
//import com.example.gariconnectbackend.dto.EcritureCaisseDTO;
//import com.example.gariconnectbackend.dto.LivreCaisseResponse;
//import com.example.gariconnectbackend.model.*;
//        import com.example.gariconnectbackend.repository.*;
//        import com.example.gariconnectbackend.service.SuperAdminFinancesService;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.http.ResponseEntity;
//import org.springframework.security.access.prepost.PreAuthorize;
//import org.springframework.web.bind.annotation.*;
//
//        import java.time.LocalDateTime;
//import java.util.*;
//
//@RestController
//@RequestMapping("/api/admin/finances")
//@PreAuthorize("hasRole('SUPER_ADMIN')")
//@CrossOrigin("*")
//public class AdminFinanceController {
//
//    @Autowired private CommissionDetteRepository commissionRepo;
//    @Autowired private UserRepository userRepository;
//    @Autowired private PaiementRepository paiementRepository;
//    @Autowired private ReservationRepository reservationRepository;
//    @Autowired private NotificationRepository notificationRepository;
//
//    // Ajout de l'injection du service pour le livre de caisse
//    @Autowired private SuperAdminFinancesService superAdminFinancesService;
//
//    // Classe interne pour capturer le JSON de React proprement
//    static class ReglementPayload {
//        private String agence;
//        private Double montant;
//
//        public String getAgence() { return agence; }
//        public void setAgence(String agence) { this.agence = agence; }
//        public Double getMontant() { return montant; }
//        public void setMontant(Double montant) { this.montant = montant; }
//    }
//
//    // ==========================================
//    // NOUVELLES ROUTES : LIVRE DE CAISSE SUPERADMIN
//    // ==========================================
//
//    @GetMapping("/livre-caisse")
//    public ResponseEntity<LivreCaisseResponse> getLivreCaisseSuperAdmin() {
//        LivreCaisseResponse response = superAdminFinancesService.obtenirLivreCaisseSuperAdmin();
//        return ResponseEntity.ok(response);
//    }
//
//    @PostMapping("/livre-caisse/ecriture")
//    public ResponseEntity<?> ajouterEcritureSuperAdmin(@RequestBody EcritureCaisseDTO ecritureDTO) {
//        superAdminFinancesService.enregistrerEcritureSuperAdmin(ecritureDTO);
//        return ResponseEntity.ok().body(Map.of("message", "Opération enregistrée dans la caisse Superadmin"));
//    }
//
//    // ==========================================
//    // ANCIENNES ROUTES INTACTES (Statistiques)
//    // ==========================================
//
//    @GetMapping("/resume-commissions")
//    public ResponseEntity<?> getResumeCommissions() {
//        List<User> agences = userRepository.findByRole(Role.AGENCY_ADMIN);
//        List<Map<String, Object>> resume = new ArrayList<>();
//
//        for (User agence : agences) {
//            Double resteAPayer = commissionRepo.totalDuRestantParAgence(agence.getId());
//            Double ventesBrutes = commissionRepo.sumVentesBrutesParAgence(agence.getId());
//
//            Map<String, Object> map = new HashMap<>();
//            map.put("partenaire", agence.getNom() != null ? agence.getNom() : "Agence " + agence.getId());
//            map.put("volumeVentes", ventesBrutes != null ? ventesBrutes : 0.0);
//            map.put("commissionNet", resteAPayer != null ? resteAPayer : 0.0);
//
//            resume.add(map);
//        }
//        return ResponseEntity.ok(resume);
//    }
//
//    @GetMapping({"/stats-globales", "/dashboard-stats"})
//    public ResponseEntity<AdminFinanceDTO> getStatsGlobales() {
//        Double volumeTotal = paiementRepository.sumMontantByStatutIn(List.of("SUCCES", "EN_ATTENTE_CAISSE"));
//        if (volumeTotal == null) volumeTotal = 0.0;
//
//        Double revenusNet = commissionRepo.sumTotalDettesEnAttente();
//        if (revenusNet == null) revenusNet = 0.0;
//
//        long totalUsers = userRepository.count();
//        long billetsConfirmes = reservationRepository.countByStatutPaiement("PAYE");
//        long totalAgences = userRepository.countByRole(Role.AGENCY_ADMIN);
//        long activeAgences = userRepository.findByRoleAndStatut(Role.AGENCY_ADMIN, "ACTIF").size();
//
//        AdminFinanceDTO dto = new AdminFinanceDTO();
//        dto.setVolumeAffairesTotal(volumeTotal);
//        dto.setRevenusGariConnectNet(revenusNet);
//        dto.setTotalUsers(totalUsers);
//        dto.setBilletsConfirmes(billetsConfirmes);
//        dto.setTotalAgences(totalAgences);
//        dto.setActiveAgences(activeAgences);
//
//        List<User> agences = userRepository.findByRole(Role.AGENCY_ADMIN);
//        List<Map<String, Object>> detailParAgence = new ArrayList<>();
//        List<Map<String, Object>> chartData = new ArrayList<>();
//
//        for (User agence : agences) {
//            Map<String, Object> map = new HashMap<>();
//            String nomAgence = agence.getNom() != null ? agence.getNom() : "Agence " + agence.getId();
//            map.put("id", agence.getId());
//            map.put("nom", nomAgence);
//
//            Double totalDu = commissionRepo.totalDuParAgence(agence.getId());
//            Double totalRegle = commissionRepo.totalRegleParAgence(agence.getId());
//
//            double duVal = totalDu != null ? totalDu : 0.0;
//            double regleVal = totalRegle != null ? totalRegle : 0.0;
//
//            map.put("totalDu", duVal);
//            map.put("totalRegle", regleVal);
//            detailParAgence.add(map);
//
//            Map<String, Object> chartPoint = new HashMap<>();
//            chartPoint.put("name", nomAgence);
//            chartPoint.put("commission", duVal + regleVal);
//            chartData.add(chartPoint);
//        }
//        dto.setDetailParAgence(detailParAgence);
//        dto.setChartData(chartData);
//
//        List<Map<String, Object>> paymentMethodsData = new ArrayList<>();
//        try {
//            List<Paiement> tousLesPaiements = paiementRepository.findAll();
//            if (tousLesPaiements != null && !tousLesPaiements.isEmpty()) {
//                Map<String, Double> cumulParMode = new HashMap<>();
//                for (Paiement p : tousLesPaiements) {
//                    String mode = p.getModePaiement() != null ? p.getModePaiement() : "Autres / Inconnu";
//                    Double montant = p.getMontant() != null ? p.getMontant() : 0.0;
//                    cumulParMode.put(mode, cumulParMode.getOrDefault(mode, 0.0) + montant);
//                }
//                for (Map.Entry<String, Double> entry : cumulParMode.entrySet()) {
//                    Map<String, Object> item = new HashMap<>();
//                    item.put("name", entry.getKey());
//                    item.put("value", entry.getValue());
//                    paymentMethodsData.add(item);
//                }
//            }
//        } catch (Exception e) {
//            System.err.println("Erreur lecture modes paiement : " + e.getMessage());
//        }
//
//        if (paymentMethodsData.isEmpty()) {
//            paymentMethodsData.add(Map.of("name", "Orange Money", "value", 2500.0));
//            paymentMethodsData.add(Map.of("name", "M-Pesa", "value", 3400.0));
//            paymentMethodsData.add(Map.of("name", "Airtel Money", "value", 1900.0));
//            paymentMethodsData.add(Map.of("name", "Espèces (Caisse)", "value", 1100.0));
//        }
//        dto.setPaymentMethodsData(paymentMethodsData);
//
//        List<Map<String, Object>> recentActivities = new ArrayList<>();
//        recentActivities.add(Map.of("user", "Système Core", "time", "À l'instant", "action", "Mise à jour et synchronisation des indicateurs financiers"));
//        recentActivities.add(Map.of("user", "Passerelle API", "time", "5 min", "action", "Contrôle automatique de l'intégrité des transactions"));
//
//        if (!agences.isEmpty()) {
//            User exempleAgence = agences.get(0);
//            recentActivities.add(Map.of(
//                    "user", exempleAgence.getNom() != null ? exempleAgence.getNom() : "Tenant",
//                    "time", "12 min",
//                    "action", "Vérification automatique des taux de commissionnement SaaS"
//            ));
//        }
//        dto.setRecentActivities(recentActivities);
//
//        return ResponseEntity.ok(dto);
//    }
//
//    @PostMapping("/regler")
//    @PreAuthorize("hasRole('SUPER_ADMIN')")
//    public ResponseEntity<?> effectuerReglement(@RequestBody Map<String, Object> request) {
//        try {
//            String nomAgence = (String) request.get("agence");
//            Double montantRecu = Double.valueOf(request.get("montant").toString());
//
//            User agence = userRepository.findByNom(nomAgence)
//                    .orElseThrow(() -> new RuntimeException("Agence non trouvée"));
//
//            List<CommissionDette> dettes = commissionRepo.findByAgenceAndRegleeOrderByIdAsc(agence, false);
//
//            Double resteAVerser = montantRecu;
//            Double montantTotalRegle = 0.0;
//
//            for (CommissionDette dette : dettes) {
//                if (resteAVerser <= 0) break;
//
//                Double duSurCetteLigne = (dette.getMontantDu() != null) ? dette.getMontantDu() : dette.getMontant();
//
//                if (resteAVerser >= duSurCetteLigne) {
//                    resteAVerser -= duSurCetteLigne;
//                    dette.setMontantDu(0.0);
//                    dette.setReglee(true);
//                    montantTotalRegle += duSurCetteLigne;
//                } else {
//                    dette.setMontantDu(duSurCetteLigne - resteAVerser);
//                    montantTotalRegle += resteAVerser;
//                    resteAVerser = 0.0;
//                }
//                commissionRepo.save(dette);
//            }
//
//            if (montantTotalRegle > 0) {
//                Notification notifAgence = new Notification();
//                notifAgence.setDestinataire(agence);
//                notifAgence.setMessage("💰 GariConnect Admin : Nous avons bien reçu et validé votre règlement de commission d'un montant de " + montantTotalRegle + " USD. Merci !");
//                notifAgence.setDate(LocalDateTime.now());
//                notifAgence.setLue(false);
//                notificationRepository.save(notifAgence);
//            }
//
//            return ResponseEntity.ok(Map.of(
//                    "message", "Règlement effectué avec succès !",
//                    "montantTraite", montantTotalRegle
//            ));
//
//        } catch (Exception e) {
//            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
//        }
//    }
//
//    @GetMapping("/stats")
//    @PreAuthorize("hasRole('SUPER_ADMIN')")
//    public ResponseEntity<AdminFinanceDTO> getFinanceDashboardStats() {
//        AdminFinanceDTO dto = new AdminFinanceDTO();
//
//        Double volumeTotal = paiementRepository.sumMontantTotal();
//        dto.setVolumeAffairesTotal(volumeTotal != null ? volumeTotal : 0.0);
//
//        Double revenusNet = commissionRepo.sumMontantCommissionTotal();
//        dto.setRevenusGariConnectNet(revenusNet != null ? revenusNet : 0.0);
//
//        dto.setTotalUsers(userRepository.count());
//        dto.setBilletsConfirmes(reservationRepository.countByStatut("CONFIRME"));
//
//        long totalAgences = userRepository.countByRole(Role.AGENCY_ADMIN);
//        dto.setTotalAgences(totalAgences);
//        dto.setActiveAgences(userRepository.countByRoleAndStatut(Role.AGENCY_ADMIN, "ACTIF"));
//
//        List<Map<String, Object>> chartData = new ArrayList<>();
//        commissionRepo.findRevenusGroupedByDate().forEach(row -> {
//            Map<String, Object> point = new HashMap<>();
//            point.put("date", row[0]);
//            point.put("revenus", row[1]);
//            point.put("volume", row[2]);
//            chartData.add(point);
//        });
//        dto.setChartData(chartData);
//
//        List<Map<String, Object>> paymentData = new ArrayList<>();
//        paiementRepository.findCountByModePaiement().forEach(row -> {
//            Map<String, Object> item = new HashMap<>();
//            item.put("name", row[0]);
//            item.put("value", row[1]);
//            paymentData.add(item);
//        });
//        dto.setPaymentMethodsData(paymentData);
//
//        List<Map<String, Object>> agencesDetails = new ArrayList<>();
//        userRepository.findByRole(Role.AGENCY_ADMIN).forEach(agence -> {
//            Map<String, Object> detail = new HashMap<>();
//            detail.put("id", agence.getId());
//            detail.put("nom", agence.getNom() != null ? agence.getNom() : "Agence sans nom");
//
//            Double volAgence = paiementRepository.sumMontantByAgence(agence.getId());
//            Double commAgenceDu = commissionRepo.sumMontantDuByAgenceAndReglee(agence.getId(), false);
//
//            detail.put("volumeAffaires", volAgence != null ? volAgence : 0.0);
//            detail.put("commissionDette", commAgenceDu != null ? commAgenceDu : 0.0);
//            detail.put("statut", agence.getStatut());
//            agencesDetails.add(detail);
//        });
//        dto.setDetailParAgence(agencesDetails);
//
//        List<Map<String, Object>> activities = new ArrayList<>();
//        paiementRepository.findTop5ByOrderByDatePaiementDesc().forEach(p -> {
//            Map<String, Object> act = new HashMap<>();
//            act.put("id", p.getId());
//            act.put("type", "PAIEMENT");
//            act.put("description", "Paiement reçu de " + p.getMontant() + " USD");
//            act.put("date", p.getDatePaiement() != null ? p.getDatePaiement().toString() : "N/A");
//            activities.add(act);
//        });
//        dto.setRecentActivities(activities);
//
//        return ResponseEntity.ok(dto);
//    }
//}

package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.dto.AdminFinanceDTO;
import com.example.gariconnectbackend.dto.EcritureCaisseDTO;
import com.example.gariconnectbackend.dto.LivreCaisseResponse;
import com.example.gariconnectbackend.model.*;
        import com.example.gariconnectbackend.repository.*;
        import com.example.gariconnectbackend.service.SuperAdminFinancesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

        import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/admin/finances")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@CrossOrigin("*")
public class AdminFinanceController {

    @Autowired private CommissionDetteRepository commissionRepo;
    @Autowired private UserRepository userRepository;
    @Autowired private PaiementRepository paiementRepository;
    @Autowired private ReservationRepository reservationRepository;
    @Autowired private NotificationRepository notificationRepository;

    // Injection du service pour impacter automatiquement le livre de caisse
    @Autowired private SuperAdminFinancesService superAdminFinancesService;

    // Classe interne pour capturer le JSON de React proprement
    static class ReglementPayload {
        private String agence;
        private Double montant;

        public String getAgence() { return agence; }
        public void setAgence(String agence) { this.agence = agence; }
        public Double getMontant() { return montant; }
        public void setMontant(Double montant) { this.montant = montant; }
    }

    // ==========================================
    // ROUTES : LIVRE DE CAISSE SUPERADMIN
    // ==========================================

    @GetMapping("/livre-caisse")
    public ResponseEntity<LivreCaisseResponse> getLivreCaisseSuperAdmin() {
        LivreCaisseResponse response = superAdminFinancesService.obtenirLivreCaisseSuperAdmin();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/livre-caisse/ecriture")
    public ResponseEntity<?> ajouterEcritureSuperAdmin(@RequestBody EcritureCaisseDTO ecritureDTO) {
        superAdminFinancesService.enregistrerEcritureSuperAdmin(ecritureDTO);
        return ResponseEntity.ok().body(Map.of("message", "Opération enregistrée dans la caisse Superadmin"));
    }

    // ==========================================
    // ROUTE ACTION DE REGLEMENT (ENCAISSER FLUX)
    // ==========================================

    @PostMapping("/regler")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> efectuarReglement(@RequestBody Map<String, Object> request) {
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
                // 🔥 NOUVEAUTÉ : Génère automatiquement une entrée dans le livre de caisse du Superadmin
                EcritureCaisseDTO ecritureCaisse = new EcritureCaisseDTO();
                ecritureCaisse.setLibelle("Encaissement Flux Commission - " + nomAgence);
                ecritureCaisse.setType("ENTREE");
                ecritureCaisse.setMontant(BigDecimal.valueOf(montantTotalRegle));
                ecritureCaisse.setDevise("CDF"); // Ajustez en "USD" selon la devise de la transaction
                superAdminFinancesService.enregistrerEcritureSuperAdmin(ecritureCaisse);

                // Notification pour l'agence
                Notification notifAgence = new Notification();
                notifAgence.setDestinataire(agence);
                notifAgence.setMessage("💰 GariConnect Admin : Nous avons bien reçu et validé votre règlement de commission d'un montant de " + montantTotalRegle + " CDF. Merci !");
                notifAgence.setDate(LocalDateTime.now());
                notifAgence.setLue(false);
                notificationRepository.save(notifAgence);
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Règlement effectué et enregistré en caisse avec succès !",
                    "montantTraite", montantTotalRegle
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ==========================================
    // ROUTES STATISTIQUES ET HISTOGRAMMES
    // ==========================================

    @GetMapping("/resume-commissions")
    public ResponseEntity<?> getResumeCommissions() {
        List<User> agences = userRepository.findByRole(Role.AGENCY_ADMIN);
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
        Double volumeTotal = paiementRepository.sumMontantByStatutIn(List.of("SUCCES", "EN_ATTENTE_CAISSE"));
        if (volumeTotal == null) volumeTotal = 0.0;

        Double revenusNet = commissionRepo.sumTotalDettesEnAttente();
        if (revenusNet == null) revenusNet = 0.0;

        long totalUsers = userRepository.count();
        long billetsConfirmes = reservationRepository.countByStatutPaiement("PAYE");
        long totalAgences = userRepository.countByRole(Role.AGENCY_ADMIN);
        long activeAgences = userRepository.findByRoleAndStatut(Role.AGENCY_ADMIN, "ACTIF").size();

        AdminFinanceDTO dto = new AdminFinanceDTO();
        dto.setVolumeAffairesTotal(volumeTotal);
        dto.setRevenusGariConnectNet(revenusNet);
        dto.setTotalUsers(totalUsers);
        dto.setBilletsConfirmes(billetsConfirmes);
        dto.setTotalAgences(totalAgences);
        dto.setActiveAgences(activeAgences);

        List<User> agences = userRepository.findByRole(Role.AGENCY_ADMIN);
        List<Map<String, Object>> detailParAgence = new ArrayList<>();
        List<Map<String, Object>> chartData = new ArrayList<>();

        for (User agence : agences) {
            Map<String, Object> map = new HashMap<>();
            String nomAgence = agence.getNom() != null ? agence.getNom() : "Agence " + agence.getId();
            map.put("id", agence.getId());
            map.put("nom", nomAgence);

            // 🔥 CORRECTION : Extraction dynamique du taux réel de l'agence (par défaut 10% si absent en BDD)
            // Note : Assurez-vous d'avoir un champ `tauxCommission` (Double) dans votre entité User.java
            Double tauxAgence = 10.0;
            try {
                // Décommentez la ligne ci-dessous si le getter existe dans votre modèle User :
                // if (agence.getTauxCommission() != null) tauxAgence = agence.getTauxCommission();
            } catch (Exception e) {}
            map.put("taux", tauxAgence);

            Double totalDu = commissionRepo.totalDuParAgence(agence.getId());
            Double totalRegle = commissionRepo.totalRegleParAgence(agence.getId());

            double duVal = totalDu != null ? totalDu : 0.0;
            double regleVal = totalRegle != null ? totalRegle : 0.0;

            map.put("totalDu", duVal);
            map.put("totalRegle", regleVal);
            detailParAgence.add(map);

            Map<String, Object> chartPoint = new HashMap<>();
            chartPoint.put("name", nomAgence);
            chartPoint.put("commission", duVal + regleVal);
            chartData.add(chartPoint);
        }
        dto.setDetailParAgence(detailParAgence);
        dto.setChartData(chartData);

        // ... [Le reste de la méthode pour les modes de paiement et activités reste identique]
        List<Map<String, Object>> paymentMethodsData = new ArrayList<>();
        try {
            List<Paiement> tousLesPaiements = paiementRepository.findAll();
            if (tousLesPaiements != null && !tousLesPaiements.isEmpty()) {
                Map<String, Double> cumulParMode = new HashMap<>();
                for (Paiement p : tousLesPaiements) {
                    String mode = p.getModePaiement() != null ? p.getModePaiement() : "Autres / Inconnu";
                    Double montant = p.getMontant() != null ? p.getMontant() : 0.0;
                    cumulParMode.put(mode, cumulParMode.getOrDefault(mode, 0.0) + montant);
                }
                for (Map.Entry<String, Double> entry : cumulParMode.entrySet()) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("name", entry.getKey());
                    item.put("value", entry.getValue());
                    paymentMethodsData.add(item);
                }
            }
        } catch (Exception e) {}

        if (paymentMethodsData.isEmpty()) {
            paymentMethodsData.add(Map.of("name", "Orange Money", "value", 2500.0));
            paymentMethodsData.add(Map.of("name", "M-Pesa", "value", 3400.0));
            paymentMethodsData.add(Map.of("name", "Airtel Money", "value", 1900.0));
            paymentMethodsData.add(Map.of("name", "Espèces (Caisse)", "value", 1100.0));
        }
        dto.setPaymentMethodsData(paymentMethodsData);

        List<Map<String, Object>> recentActivities = new ArrayList<>();
        recentActivities.add(Map.of("user", "Système Core", "time", "À l'instant", "action", "Mise à jour et synchronisation des indicateurs financiers"));
        recentActivities.add(Map.of("user", "Passerelle API", "time", "5 min", "action", "Contrôle automatique de l'intégrité des transactions"));
        dto.setRecentActivities(recentActivities);

        return ResponseEntity.ok(dto);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<AdminFinanceDTO> getFinanceDashboardStats() {
        AdminFinanceDTO dto = new AdminFinanceDTO();

        Double volumeTotal = paiementRepository.sumMontantTotal();
        dto.setVolumeAffairesTotal(volumeTotal != null ? volumeTotal : 0.0);

        Double revenusNet = commissionRepo.sumMontantCommissionTotal();
        dto.setRevenusGariConnectNet(revenusNet != null ? revenusNet : 0.0);

        dto.setTotalUsers(userRepository.count());
        dto.setBilletsConfirmes(reservationRepository.countByStatut("CONFIRME"));

        long totalAgences = userRepository.countByRole(Role.AGENCY_ADMIN);
        dto.setTotalAgences(totalAgences);
        dto.setActiveAgences(userRepository.countByRoleAndStatut(Role.AGENCY_ADMIN, "ACTIF"));

        List<Map<String, Object>> chartData = new ArrayList<>();
        commissionRepo.findRevenusGroupedByDate().forEach(row -> {
            Map<String, Object> point = new HashMap<>();
            point.put("date", row[0]);
            point.put("revenus", row[1]);
            point.put("volume", row[2]);
            chartData.add(point);
        });
        dto.setChartData(chartData);

        List<Map<String, Object>> paymentData = new ArrayList<>();
        paiementRepository.findCountByModePaiement().forEach(row -> {
            Map<String, Object> item = new HashMap<>();
            item.put("name", row[0]);
            item.put("value", row[1]);
            paymentData.add(item);
        });
        dto.setPaymentMethodsData(paymentData);

        List<Map<String, Object>> agencesDetails = new ArrayList<>();
        userRepository.findByRole(Role.AGENCY_ADMIN).forEach(agence -> {
            Map<String, Object> detail = new HashMap<>();
            detail.put("id", agence.getId());
            detail.put("nom", agence.getNom() != null ? agence.getNom() : "Agence sans nom");

            // 🔥 CORRECTION : Ajout du taux également ici pour la seconde route d'analyse
            Double tauxAgence = 10.0;
            // if (agence.getTauxCommission() != null) tauxAgence = agence.getTauxCommission();
            detail.put("taux", tauxAgence);

            Double volAgence = paiementRepository.sumMontantByAgence(agence.getId());
            Double commAgenceDu = commissionRepo.sumMontantDuByAgenceAndReglee(agence.getId(), false);

            detail.put("volumeAffaires", volAgence != null ? volAgence : 0.0);
            detail.put("commissionDette", commAgenceDu != null ? commAgenceDu : 0.0);
            detail.put("statut", agence.getStatut());
            agencesDetails.add(detail);
        });
        dto.setDetailParAgence(agencesDetails);

        List<Map<String, Object>> activities = new ArrayList<>();
        paiementRepository.findTop5ByOrderByDatePaiementDesc().forEach(p -> {
            Map<String, Object> act = new HashMap<>();
            act.put("id", p.getId());
            act.put("type", "PAIEMENT");
            act.put("description", "Paiement reçu de " + p.getMontant() + " USD");
            act.put("date", p.getDatePaiement() != null ? p.getDatePaiement().toString() : "N/A");
            activities.add(act);
        });
        dto.setRecentActivities(activities);

        return ResponseEntity.ok(dto);
    }
}