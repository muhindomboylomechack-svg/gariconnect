
package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.model.Courrier;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.model.Vehicule;
import com.example.gariconnectbackend.model.FinanceTransaction; // ✅ Ajout
import com.example.gariconnectbackend.repository.CommissionDetteRepository;
import com.example.gariconnectbackend.repository.CourrierRepository;
import com.example.gariconnectbackend.repository.UserRepository;
import com.example.gariconnectbackend.repository.VehiculeRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate; // ✅ Ajout
import java.time.LocalDateTime;
import java.util.List;

import com.example.gariconnectbackend.model.Notification;
import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.repository.NotificationRepository;

import java.util.Optional;
import java.util.UUID;



import com.example.gariconnectbackend.model.CommissionDette; // ✅ Ajout


@Service
public class CourrierService {
    @Autowired private CourrierRepository courrierRepository;
    @Autowired private CommissionDetteRepository commissionRepo;
    @Autowired private VehiculeRepository vehiculeRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private WhatsAppService whatsAppService;

    // ✅ Injection du service financier pour l'encaissement
    @Autowired private FinanceService financeService;

    @Transactional
    public Courrier modifier(Long id, Courrier details) {
        Courrier c = courrierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Colis non trouvé"));

        c.setDescription(details.getDescription());
        c.setPrix(details.getPrix());
        c.setNomExpediteur(details.getNomExpediteur());
        c.setTelExpediteur(details.getTelExpediteur());
        c.setNomDestinataire(details.getNomDestinataire());
        c.setTelDestinataire(details.getTelDestinataire());

        if (details.getStatut() != null) {
            c.setStatut(details.getStatut());
        }

        return courrierRepository.save(c);
    }

    @Transactional
    public void supprimer(Long id) {
        courrierRepository.deleteById(id);
    }

    @Transactional
    public Courrier assignerTransport(Long id, Long vehiculeId, Long chauffeurId) {
        Courrier c = courrierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Colis non trouvé"));

        Vehicule v = vehiculeRepository.findById(vehiculeId)
                .orElseThrow(() -> new RuntimeException("Véhicule non trouvé"));

        User chauffeur = userRepository.findById(chauffeurId)
                .orElseThrow(() -> new RuntimeException("Chauffeur non trouvé"));

        c.setVehicule(v);
        c.setChauffeur(chauffeur);

        return mettreAJourStatut(id, "EN_ROUTE");
    }


    @Transactional
    public Courrier enregistrerColis(Courrier courrier, User agence) {
        courrier.setAgence(agence);
        courrier.setStatut("EN_ATTENTE");
        courrier.setDateEnvoi(LocalDateTime.now());

        if (courrier.getCodeRetrait() == null || courrier.getCodeRetrait().trim().isEmpty()) {
            courrier.setCodeRetrait(genererCodeUnique());
        }

        // 1. Calcul de la commission
        // Récupère le taux de l'agence (ex: 10%), sinon 10.0 par défaut
        Double tauxCommission = (agence.getTauxCommission() != null) ? agence.getTauxCommission() : 10.0;

        if (courrier.getPrix() != null) {
            Double montantComm = (courrier.getPrix() * tauxCommission) / 100;
            courrier.setMontantCommission(montantComm);
        }

        // Sauvegarde initiale du courrier
        Courrier nouveauCourrier = courrierRepository.save(courrier);

        if (nouveauCourrier.getPrix() != null && nouveauCourrier.getPrix() > 0) {

            // ✅ A. ENCAISSEMENT AUTOMATIQUE DANS LE LIVRE DE CAISSE
            FinanceTransaction encaissement = new FinanceTransaction();
            encaissement.setAgence(agence);
            encaissement.setDate(LocalDate.now());
            encaissement.setTypeTransaction("ENTREE");
            String typeColis = (nouveauCourrier.getType() != null) ? nouveauCourrier.getType() : "COLIS/COURRIER";
            encaissement.setDescription("Paiement pour l'envoi d'un " + typeColis + " (Code: " + nouveauCourrier.getCodeRetrait() + ")");
            encaissement.setMontant(nouveauCourrier.getPrix());
            encaissement.setDevise("USD");
            encaissement.setEntite("Client : " + nouveauCourrier.getNomExpediteur());
            encaissement.setDocumentRef("COURRIER-" + nouveauCourrier.getCodeRetrait());
            financeService.createTransaction(encaissement);

            // ✅ B. CRÉATION DE LA DETTE DE COMMISSION (NOUVEAU)
            if (nouveauCourrier.getMontantCommission() != null && nouveauCourrier.getMontantCommission() > 0) {
                CommissionDette dette = new CommissionDette();
                dette.setAgence(agence);
                dette.setCourrier(nouveauCourrier); // On lie la dette au courrier
                dette.setLibelle("Commission sur envoi " + typeColis + " #" + nouveauCourrier.getCodeRetrait());
                dette.setMontant(nouveauCourrier.getPrix()); // Prix brut payé par le client
                dette.setMontantCommission(tauxCommission); // Taux appliqué (ex: 10%)
                dette.setMontantDu(nouveauCourrier.getMontantCommission()); // Montant net à reverser à l'admin
                dette.setReglee(false);
                dette.setDateCreation(LocalDateTime.now());

                commissionRepo.save(dette);
                System.out.println("✅ Dette de commission de " + dette.getMontantDu() + " USD générée pour l'agence " + agence.getNom());
            }
        }

        // Logique de notification (inchangée)
        String typeTxt = (nouveauCourrier.getType() != null && nouveauCourrier.getType().equalsIgnoreCase("COLIS")) ? "colis" : "courrier";
        String code = nouveauCourrier.getCodeRetrait();
        String msgExpediteur = "GariConnect : Votre " + typeTxt + " a été enregistré avec succès. Code de suivi : " + code + ". Il est actuellement en attente d'expédition.";
        String msgDestinataire = "GariConnect : Un " + typeTxt + " (Code de retrait : " + code + ") vous a été envoyé par " + nouveauCourrier.getNomExpediteur() + ". Il est en attente d'expédition.";

        traiterNotification(nouveauCourrier.getNomExpediteur(), nouveauCourrier.getTelExpediteur(), msgExpediteur);
        traiterNotification(nouveauCourrier.getNomDestinataire(), nouveauCourrier.getTelDestinataire(), msgDestinataire);

        if (nouveauCourrier.getTelExpediteur() != null && !nouveauCourrier.getTelExpediteur().trim().isEmpty()) {
            whatsAppService.envoyerMessage(nouveauCourrier.getTelExpediteur(), msgExpediteur);
        }

        if (nouveauCourrier.getTelDestinataire() != null && !nouveauCourrier.getTelDestinataire().trim().isEmpty()) {
            whatsAppService.envoyerMessage(nouveauCourrier.getTelDestinataire(), msgDestinataire);
        }

        return nouveauCourrier;
    }
    @Transactional
    public Courrier modifierCourrier(Long id, Courrier details) {
        Courrier c = courrierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Courrier introuvable"));
        c.setDescription(details.getDescription());
        c.setNomDestinataire(details.getNomDestinataire());
        c.setTelDestinataire(details.getTelDestinataire());

        // ⚠️ Si on modifie le prix, faut-il mettre à jour le livre de caisse ?
        // Pour la simplicité initiale, on ne touche qu'au prix du courrier.
        c.setPrix(details.getPrix());

        return courrierRepository.save(c);
    }

    @Transactional
    public Courrier mettreAJourStatut(Long id, String statut) {
        Courrier c = courrierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Colis introuvable"));

        c.setStatut(statut);
        Courrier courrierMisAJour = courrierRepository.save(c);

        String typeTxt = "envoi";
        if (courrierMisAJour.getType() != null) {
            if (courrierMisAJour.getType().equalsIgnoreCase("COLIS")) {
                typeTxt = "colis";
            } else if (courrierMisAJour.getType().equalsIgnoreCase("COURRIER")) {
                typeTxt = "courrier";
            }
        }

        String statutLisible = statut;
        if (statut.equalsIgnoreCase("EN_ROUTE")) {
            statutLisible = "en cours d'expédition / en route \uD83D\uDE9A";
        } else if (statut.equalsIgnoreCase("ARRIVE")) {
            statutLisible = "arrivé à destination et prêt pour le retrait \uD83C\uDFC1";
        } else if (statut.equalsIgnoreCase("LIVRE")) {
            statutLisible = "livré avec succès ✅";
        }

        String code = courrierMisAJour.getCodeRetrait();

        String msgExpediteur = "GariConnect : Le statut de votre " + typeTxt + " (Code : " + code + ") a changé. Nouveau statut : " + statutLisible;
        String msgDestinataire = "GariConnect : Du nouveau pour votre " + typeTxt + " (Code de retrait : " + code + ") envoyé par " + courrierMisAJour.getNomExpediteur() + ". Il est désormais : " + statutLisible;

        traiterNotification(courrierMisAJour.getNomExpediteur(), courrierMisAJour.getTelExpediteur(), msgExpediteur);
        traiterNotification(courrierMisAJour.getNomDestinataire(), courrierMisAJour.getTelDestinataire(), msgDestinataire);

        if (courrierMisAJour.getTelExpediteur() != null && !courrierMisAJour.getTelExpediteur().trim().isEmpty()) {
            whatsAppService.envoyerMessage(courrierMisAJour.getTelExpediteur(), msgExpediteur);
        }

        if (courrierMisAJour.getTelDestinataire() != null && !courrierMisAJour.getTelDestinataire().trim().isEmpty()) {
            whatsAppService.envoyerMessage(courrierMisAJour.getTelDestinataire(), msgDestinataire);
        }

        return courrierMisAJour;
    }

    public List<Courrier> getCourriersParExpediteur(String tel) {
        return courrierRepository.findByTelExpediteur(tel);
    }

    private void traiterNotification(String nomUtilisateur, String telephone, String message) {
        if (nomUtilisateur == null || nomUtilisateur.trim().isEmpty()) {
            return;
        }

        Optional<User> clientOpt = userRepository.findByNomIgnoreCase(nomUtilisateur);
        if (clientOpt.isEmpty()) {
            return;
        }

        User user = clientOpt.get();
        if (user.getRole() == Role.CLIENT) {
            Notification notif = new Notification();
            notif.setDestinataire(user);
            notif.setMessage(message);
            notificationRepository.save(notif);
        }
    }

    public List<Courrier> getCourriersParAgence(Long agenceId) {
        if (agenceId == null) {
            throw new IllegalArgumentException("L'ID de l'agence ne peut pas être null");
        }
        return courrierRepository.findByAgence_Id(agenceId);
    }

    private String genererCodeUnique() {
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
    // 🚀 NOUVEAU : Lister tous les courriers d'une agence
    public List<Courrier> obtenirMesCourriers(User agence) {
        return courrierRepository.findByAgenceOrigineOrderByIdDesc(agence);
    }
}

