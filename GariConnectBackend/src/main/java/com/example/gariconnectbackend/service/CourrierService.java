package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.model.Courrier;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.model.Vehicule;
import com.example.gariconnectbackend.model.FinanceTransaction;
import com.example.gariconnectbackend.model.CommissionDette;
import com.example.gariconnectbackend.model.Notification;
import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.repository.*;
import com.example.gariconnectbackend.dto.CourrierDTO;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CourrierService {

    @Autowired
    private CourrierRepository courrierRepository;

    @Autowired
    private CommissionDetteRepository commissionRepo;

    @Autowired
    private VehiculeRepository vehiculeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    /**
     * 🚀 Création d'un courrier/colis avec détection automatique des comptes clients (Cas 1, 2, 3, 4)
     */
    @Transactional
    public Courrier creerCourrier(Courrier courrier) {
        courrier.setCodeRetrait(genererCodeUnique());
        courrier.setStatut("EN_ATTENTE");
        courrier.setDateEnvoi(LocalDateTime.now());

        // 🔍 Détection Expéditeur : Si le numéro correspond à un compte système
        if (courrier.getTelExpediteur() != null && !courrier.getTelExpediteur().trim().isEmpty()) {
            Optional<User> expOpt = userRepository.findByTelephone(courrier.getTelExpediteur().trim());
            if (expOpt.isPresent()) {
                courrier.setExpediteurCompte(expOpt.get());
                courrier.setNomExpediteur(expOpt.get().getNom()); // Harmonisation du nom officiel
            }
        }

        // 🔍 Détection Destinataire : Si le numéro correspond à un compte système
        if (courrier.getTelDestinataire() != null && !courrier.getTelDestinataire().trim().isEmpty()) {
            Optional<User> destOpt = userRepository.findByTelephone(courrier.getTelDestinataire().trim());
            if (destOpt.isPresent()) {
                courrier.setDestinataireCompte(destOpt.get());
                courrier.setNomDestinataire(destOpt.get().getNom()); // Harmonisation du nom officiel
            }
        }

        // Sauvegarde initiale en Base de Données
        Courrier saved = courrierRepository.save(courrier);

        // 🔔 Flux d'envoi des notifications natives dans l'application
        if (saved.getExpediteurCompte() != null) {
            traiterNotificationParCompte(saved.getExpediteurCompte(),
                    "Votre colis à destination de " + saved.getNomDestinataire() + " a été enregistré. Code: " + saved.getCodeRetrait());
        } else {
            traiterNotification(saved.getNomExpediteur(), saved.getTelExpediteur(), "Votre colis a été enregistré.");
        }

        if (saved.getDestinataireCompte() != null) {
            traiterNotificationParCompte(saved.getDestinataireCompte(),
                    "Un colis vous a été envoyé par " + saved.getNomExpediteur() + ". Code de retrait: " + saved.getCodeRetrait());
        } else {
            traiterNotification(saved.getNomDestinataire(), saved.getTelDestinataire(), "Un colis vous a été envoyé.");
        }

        return saved;
    }

    /**
     * 🚀 NOUVEAU : Récupération intelligente et unifiée des colis pour le Hub Client Connecté
     */
    public List<Courrier> getCourriersPourClientConnecte(User client) {
        return courrierRepository.findAllByClientCompteOrTelephone(client, client.getTelephone());
    }

    /**
     * Mise à jour du statut d'un colis avec gestion financière (Commissions, Dettes)
     */


    /**
     * Assigne un groupe de courriers/colis à un véhicule, un chauffeur et un trajet spécifique
     */
    @Transactional
    public List<Courrier> assignerCourriersAChauffeurEtVehicule(List<Long> courrierIds, Long vehiculeId) {
        Vehicule vehicule = vehiculeRepository.findById(vehiculeId)
                .orElseThrow(() -> new RuntimeException("Véhicule introuvable"));

        if (vehicule.getChauffeurActuel() == null) {
            throw new RuntimeException("Ce véhicule n'a aucun chauffeur assigné actuellement.");
        }
        if (vehicule.getTrajetActuel() == null) {
            throw new RuntimeException("Ce véhicule n'est assigné à aucun trajet actuellement.");
        }

        User chauffeur = vehicule.getChauffeurActuel();
        var trajet = vehicule.getTrajetActuel();

        List<Courrier> courriers = courrierRepository.findAllById(courrierIds);

        for (Courrier c : courriers) {
            c.setVehicule(vehicule);
            c.setChauffeur(chauffeur);
            c.setTrajet(trajet);
            c.setStatut("EN_ROUTE"); // Le colis passe en transit
        }

        List<Courrier> savedCourriers = courrierRepository.saveAll(courriers);

        // Notification générale au chauffeur pour sa feuille de route
        traiterNotificationParCompte(chauffeur, "Vous avez de nouveaux courriers/colis assignés pour votre trajet.");

        return savedCourriers;
    }

    /**
     * Récupère les colis envoyés par un numéro de téléphone d'expéditeur
     */
    public List<Courrier> getCourriersParExpediteur(String tel) {
        return courrierRepository.findByTelExpediteur(tel);
    }

    /**
     * Récupère la liste des colis liés à une agence spécifique
     */
    public List<Courrier> getCourriersParAgence(Long agenceId) {
        if (agenceId == null) {
            throw new IllegalArgumentException("L'ID de l'agence ne peut pas être null");
        }
        return courrierRepository.findByAgence_Id(agenceId);
    }

    /**
     * Méthode utilitaire interne pour notifier un utilisateur via son entité de compte User
     */
    private void traiterNotificationParCompte(User user, String message) {
        Notification notif = new Notification();
        notif.setDestinataire(user);
        notif.setMessage(message);
        notificationRepository.save(notif);
    }

    /**
     * Méthode utilitaire historique pour notifier par nom/téléphone brut (si rôle CLIENT)
     */
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
            traiterNotificationParCompte(user, message);
        }
    }

    /**
     * Génère un code unique de retrait à 8 caractères alphanumériques
     */
    private String genererCodeUnique() {
        return UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }


    // Déclaration de la méthode manquante
    public Optional<Courrier> findByCodeRetrait(String codeRetrait) {
        return courrierRepository.findByCodeRetrait(codeRetrait);
    }

    public Courrier sauvegarder(Courrier courrier) {
        return courrierRepository.save(courrier);
    }



    @Autowired
    private TrajetRepository trajetRepository; // Si tu as besoin de lier le trajet

    public Courrier crearDemande(CourrierDTO dto) {
        Courrier courrier = new Courrier();
        courrier.setNomExpediteur(dto.getNomExpediteur());
        courrier.setTelExpediteur(dto.getTelExpediteur());
        courrier.setNomDestinataire(dto.getNomDestinataire());
        courrier.setTelDestinataire(dto.getTelDestinataire());
        courrier.setType(dto.getType());
        courrier.setDescription(dto.getDescription());
        courrier.setPoidsKg(dto.getPoidsKg());
        courrier.setValeurEstimee(dto.getValeurEstimee());
        courrier.setDevise(dto.getDevise());
        courrier.setEstFragile(dto.isEstFragile());
        courrier.setStatut("EN_ATTENTE"); // Statut par défaut pour l'agence

        // Liaison avec le trajet si un ID est fourni
        if (dto.getTrajetId() != null) {
            trajetRepository.findById(dto.getTrajetId()).ifPresent(courrier::setTrajet);
        }

        // Génération d'un code de retrait unique (Ex: GARI-XXXX)
        String codeUnique = "FEE" + Long.toHexString(Double.doubleToLongBits(Math.random())).substring(0, 5).toUpperCase();
        courrier.setCodeRetrait(codeUnique);

        return courrierRepository.save(courrier);
    }

    public Courrier rejeterDemande(Long id, String motifRejet) {
        // 1. Recherche du colis en base de données
        Courrier courrier = courrierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Colis introuvable avec l'ID : " + id));

        // 2. Mise à jour du statut à REJETE
        courrier.setStatut("REJETE");

        // 3. Sauvegarde immédiate
        Courrier courrierRejete = courrierRepository.save(courrier);

        // 4. Envoi automatique de la notification personnalisée au client
        String msgRejet = "Votre demande de dépôt du colis contenant '" + courrierRejete.getDescription() + "' a été rejetée par l'agence.";
        if (motifRejet != null && !motifRejet.trim().isEmpty()) {
            msgRejet += " Motif : " + motifRejet;
        }

        // Utilisation du système de notification existant selon le profil du client
        if (courrierRejete.getExpediteurCompte() != null) {
            traiterNotificationParCompte(courrierRejete.getExpediteurCompte(), msgRejet);
        } else {
            traiterNotification(courrierRejete.getNomExpediteur(), courrierRejete.getTelExpediteur(), msgRejet);
        }

        return courrierRejete;
    }



    /**
     * 🚀 Validation d'une demande avec intégration du taux de change dynamique fourni par l'agent
     */
    public Courrier validerDemande(Long id, Double poidsReel, String devise, Double valeurEstimee, Double tauxChange, User agence) {
        Courrier courrier = courrierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Colis introuvable avec l'ID : " + id));

        // 1. Remplissage des données physiques, financières et du taux de change saisi
        courrier.setPoidsKg(poidsReel);
        courrier.setDevise(devise);
        courrier.setValeurEstimee(valeurEstimee);
        courrier.setTauxApplique(tauxChange); // 👈 Enregistrement du taux

        // 2. Assignation de l'agence qui valide le colis
        courrier.setAgence(agence);

        // 3. Remplissage des champs vides du pré-enregistrement
        if (courrier.getCodeRetrait() == null || courrier.getCodeRetrait().trim().isEmpty()) {
            courrier.setCodeRetrait(genererCodeUnique());
        }

        if (courrier.getDateEnvoi() == null) {
            courrier.setDateEnvoi(LocalDateTime.now());
        }

        // 4. Passage du statut à VALIDE
        courrier.setStatut("EN_ATTENTE");

        return courrierRepository.save(courrier);
    }

    /**
     * Mise à jour du statut d'un colis avec gestion financière (Commissions, Dettes)
     * CORRECTION MULTI-DEVISE : Conversion basée sur le taux réel appliqué à la validation
     */
    @Transactional
    public Courrier mettreAJourStatut(Long id, String nouveauStatut) {
        Courrier courrier = courrierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Courrier introuvable avec l'ID: " + id));

        courrier.setStatut(nouveauStatut);
        Courrier courrierMisAJour = courrierRepository.save(courrier);

        // Si le colis arrive à destination, on déclenche les calculs financiers
        if ("ARRIVE".equalsIgnoreCase(nouveauStatut)) {
            if (courrierMisAJour.getPrix() != null && courrierMisAJour.getMontantCommission() != null) {
                double commissionMontant = courrierMisAJour.getMontantCommission();

                // 💱 Normalisation Multi-devise : Si la commission est en USD, conversion vers la comptabilité (FC)
                if ("USD".equalsIgnoreCase(courrierMisAJour.getDevise())) {
                    // Utilisation du taux historique saisi par l'agent (fallback par défaut à 2800.0 si null)
                    double tauxUtilise = (courrierMisAJour.getTauxApplique() != null) ? courrierMisAJour.getTauxApplique() : 2800.0;
                    commissionMontant = commissionMontant * tauxUtilise;
                }

                if (courrierMisAJour.getAgence() != null) {
                    User agence = courrierMisAJour.getAgence();

                    // Recherche ou création d'une fiche de commission/dette pour l'agence ce jour-là
                    CommissionDette com = commissionRepo.findByAgenceAndDateCalcul(agence, LocalDate.now())
                            .orElseGet(() -> {
                                CommissionDette newCom = new CommissionDette();
                                newCom.setAgence(agence);
                                newCom.setDateCalcul(LocalDate.now());
                                newCom.setTotalCommissionsCumulees(0.0);
                                newCom.setResteAPayerRecouvrer(0.0);
                                return newCom;
                            });

                    // Cumul des commissions et mise à jour de la dette (Désormais harmonisé)
                    com.setTotalCommissionsCumulees(com.getTotalCommissionsCumulees() + commissionMontant);
                    com.setResteAPayerRecouvrer(com.getResteAPayerRecouvrer() + commissionMontant);
                    commissionRepo.save(com);
                }
            }

            // Notifications d'arrivée à destination
            String msgExpediteur = "Votre colis contenant '" + courrierMisAJour.getDescription() + "' est bien arrivé à destination.";
            if (courrierMisAJour.getExpediteurCompte() != null) {
                traiterNotificationParCompte(courrierMisAJour.getExpediteurCompte(), msgExpediteur);
            } else {
                traiterNotification(courrierMisAJour.getNomExpediteur(), courrierMisAJour.getTelExpediteur(), msgExpediteur);
            }

            String msgDestinataire = "Le colis envoyé par " + courrierMisAJour.getNomExpediteur() + " est disponible à l'agence. Code de retrait requis.";
            if (courrierMisAJour.getDestinataireCompte() != null) {
                traiterNotificationParCompte(courrierMisAJour.getDestinataireCompte(), msgDestinataire);
            } else {
                traiterNotification(courrierMisAJour.getNomDestinataire(), courrierMisAJour.getTelDestinataire(), msgDestinataire);
            }
        }

        return courrierMisAJour;
    }
}