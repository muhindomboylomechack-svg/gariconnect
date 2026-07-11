package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.model.Notification;
import com.example.gariconnectbackend.model.Trajet;
import com.example.gariconnectbackend.model.Vehicule;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.NotificationRepository;
import com.example.gariconnectbackend.repository.TrajetRepository;
import com.example.gariconnectbackend.repository.VehiculeRepository;
import com.example.gariconnectbackend.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TrajetService {

    @Autowired private TrajetRepository trajetRepository;
    @Autowired private VehiculeRepository vehiculeRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Transactional
    public Trajet creerTrajet(Trajet trajet, Long agenceId) {
        // Validation et liaison de l'agence propriétaire (L'entreprise AGENCY_ADMIN)
        User agence = userRepository.findById(agenceId)
                .orElseThrow(() -> new EntityNotFoundException("Agence introuvable avec l'ID: " + agenceId));
        trajet.setAgence(agence);

        // Validation du véhicule si présent
        if (trajet.getVehicule() != null && trajet.getVehicule().getId() != null) {
            Vehicule v = vehiculeRepository.findById(trajet.getVehicule().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Véhicule introuvable"));
            trajet.setVehicule(v);
        }

        // Validation du chauffeur si présent
        if (trajet.getChauffeur() != null && trajet.getChauffeur().getId() != null) {
            User chauffeur = userRepository.findById(trajet.getChauffeur().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Chauffeur introuvable"));
            trajet.setChauffeur(chauffeur);
        }

        trajet.setStatut("PROGRAMME");
        return trajetRepository.save(trajet);
    }

    @Transactional
    public Trajet modifierTrajet(Long id, Trajet details, Long agenceId) {
        Trajet trajet = trajetRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Trajet introuvable"));

        if (!trajet.getAgence().getId().equals(agenceId)) {
            throw new RuntimeException("Action non autorisée : Ce trajet appartient à une autre agence.");
        }

        trajet.setDepart(details.getDepart());
        trajet.setDestination(details.getDestination());
        trajet.setDateHeureDepart(details.getDateHeureDepart());
        trajet.setJoursSemaine(details.getJoursSemaine());
        trajet.setPrix(details.getPrix());
        trajet.setPlacesDisponibles(details.getPlacesDisponibles());

        if (details.getVehicule() != null) {
            Vehicule v = vehiculeRepository.findById(details.getVehicule().getId()).orElse(null);
            trajet.setVehicule(v);
        }
        if (details.getChauffeur() != null) {
            User c = userRepository.findById(details.getChauffeur().getId()).orElse(null);
            trajet.setChauffeur(c);
        }

        return trajetRepository.save(trajet);
    }

    @Transactional
    public void supprimerTrajet(Long id, Long agenceId) {
        Trajet trajet = trajetRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Trajet introuvable"));

        if (!trajet.getAgence().getId().equals(agenceId)) {
            throw new RuntimeException("Action non autorisée pour cette agence.");
        }
        trajetRepository.delete(trajet);
    }
    /**
     * ✅ NOTIFIER LE CHAUFFEUR
     */
    public void envoyerNotificationChauffeur(User chauffeur, String message) {
        if (chauffeur != null) {
            Notification notif = new Notification();
            notif.setDestinataire(chauffeur);
            notif.setMessage(message);
            notif.setDate(LocalDateTime.now());
            notif.setLue(false);
            notificationRepository.save(notif);
        }
    }

//    /**
//     * 🟢 1. CRÉER UN TRAJET : Verrouillage du Véhicule et du Chauffeur
//     */
//    @Transactional
//    public Trajet creerTrajet(Trajet trajet, Long agenceId) {
//        // 1. Verrouillage du Véhicule
//        if (trajet.getVehicule() != null && trajet.getVehicule().getId() != null) {
//            Vehicule vehicule = vehiculeRepository.findById(trajet.getVehicule().getId())
//                    .orElseThrow(() -> new EntityNotFoundException("Véhicule introuvable"));
//
//            vehicule.setStatut("Aligné a un trajet"); // 🔥 VERROUILLAGE
//            vehiculeRepository.save(vehicule);
//            trajet.setVehicule(vehicule);
//
//            if (trajet.getPlacesDisponibles() == null) {
//                trajet.setPlacesDisponibles(vehicule.getCapacite());
//            }
//        }
//
//        // 2. Verrouillage du Chauffeur
//        User chauffeurConnecte = null;
//        if (trajet.getChauffeur() != null && trajet.getChauffeur().getId() != null) {
//            chauffeurConnecte = userRepository.findById(trajet.getChauffeur().getId())
//                    .orElseThrow(() -> new EntityNotFoundException("Chauffeur introuvable"));
//
//            chauffeurConnecte.setStatut("Aligné a un trajet"); // 🔥 VERROUILLAGE
//            userRepository.save(chauffeurConnecte);
//            trajet.setChauffeur(chauffeurConnecte);
//        }
//
//        if (trajet.getStatut() == null) {
//            trajet.setStatut("PROGRAMME");
//        }
//
//        Trajet nouveauTrajet = trajetRepository.save(trajet);
//
//        // 3. Notification
//        if (chauffeurConnecte != null) {
//            envoyerNotificationChauffeur(
//                    chauffeurConnecte,
//                    "Nouvelle mission assignée : " + trajet.getDepart() + " ➔ " + trajet.getDestination()
//            );
//        }
//
//        return nouveauTrajet;
//    }

//    /**
//     * 🔄 2. MODIFIER UN TRAJET : Gestion intelligente des échanges de ressources
//     */
//    @Transactional
//    public Trajet modifierTrajet(Long id, Trajet trajetDetails, Long agenceId) {
//        Trajet trajet = trajetRepository.findById(id)
//                .orElseThrow(() -> new EntityNotFoundException("Trajet introuvable"));
//
//        if (!trajet.getAgence().getId().equals(agenceId)) {
//            throw new SecurityException("Vous n'êtes pas autorisé à modifier ce trajet.");
//        }
//
//        // 1. Changement de Véhicule (Libérer l'ancien, verrouiller le nouveau)
//        if (trajetDetails.getVehicule() != null && trajetDetails.getVehicule().getId() != null) {
//            if (trajet.getVehicule() == null || !trajet.getVehicule().getId().equals(trajetDetails.getVehicule().getId())) {
//                // Libérer l'ancien
//                if (trajet.getVehicule() != null) {
//                    Vehicule ancienVehicule = trajet.getVehicule();
//                    ancienVehicule.setStatut("DISPONIBLE");
//                    vehiculeRepository.save(ancienVehicule);
//                }
//                // Verrouiller le nouveau
//                Vehicule nouveauVehicule = vehiculeRepository.findById(trajetDetails.getVehicule().getId()).orElseThrow();
//                nouveauVehicule.setStatut("Aligné a un trajet");
//                vehiculeRepository.save(nouveauVehicule);
//                trajet.setVehicule(nouveauVehicule);
//            }
//        }
//
//        // 2. Changement de Chauffeur (Libérer l'ancien, verrouiller le nouveau)
//        if (trajetDetails.getChauffeur() != null && trajetDetails.getChauffeur().getId() != null) {
//            if (trajet.getChauffeur() == null || !trajet.getChauffeur().getId().equals(trajetDetails.getChauffeur().getId())) {
//                // Libérer l'ancien
//                if (trajet.getChauffeur() != null) {
//                    User ancienChauffeur = trajet.getChauffeur();
//                    ancienChauffeur.setStatut("DISPONIBLE");
//                    userRepository.save(ancienChauffeur);
//                }
//                // Verrouiller le nouveau
//                User nouveauChauffeur = userRepository.findById(trajetDetails.getChauffeur().getId()).orElseThrow();
//                nouveauChauffeur.setStatut("Aligné a un trajet");
//                userRepository.save(nouveauChauffeur);
//                trajet.setChauffeur(nouveauChauffeur);
//            }
//        }
//
//        trajet.setDepart(trajetDetails.getDepart());
//        trajet.setDestination(trajetDetails.getDestination());
//        trajet.setDateHeureDepart(trajetDetails.getDateHeureDepart());
//        trajet.setJoursSemaine(trajetDetails.getJoursSemaine());
//        trajet.setPrix(trajetDetails.getPrix());
//        trajet.setPlacesDisponibles(trajetDetails.getPlacesDisponibles());
//
//        if (trajetDetails.getStatut() != null) {
//            trajet.setStatut(trajetDetails.getStatut());
//        }
//
//        return trajetRepository.save(trajet);
//    }

    /**
     * 🛑 3. SUPPRIMER UN TRAJET : Libération des ressources
     */
//    @Transactional
//    public void supprimerTrajet(Long id, Long agenceId) {
//        Trajet trajet = trajetRepository.findById(id)
//                .orElseThrow(() -> new EntityNotFoundException("Trajet introuvable"));
//
//        if (!trajet.getAgence().getId().equals(agenceId)) {
//            throw new SecurityException("Vous n'êtes pas autorisé à supprimer ce trajet.");
//        }
//
//        // 🔓 LIBÉRATION DES RESSOURCES
//        if (trajet.getVehicule() != null) {
//            trajet.getVehicule().setStatut("DISPONIBLE");
//            vehiculeRepository.save(trajet.getVehicule());
//        }
//        if (trajet.getChauffeur() != null) {
//            trajet.getChauffeur().setStatut("DISPONIBLE");
//            userRepository.save(trajet.getChauffeur());
//        }
//
//        trajetRepository.delete(trajet);
//    }
// 🚀 AJOUTER CETTE MÉTHODE :
    public List<Trajet> getAllTrajets() {
        return trajetRepository.findAll();
    }
    /**
     * 🚦 4. METTRE A JOUR LE STATUT : Libération à la fin de la course
     */
    @Transactional
    public void mettreAJourStatut(Long trajetId, String nouveauStatut) {
        Trajet trajet = trajetRepository.findById(trajetId)
                .orElseThrow(() -> new RuntimeException("Trajet non trouvé"));

        trajet.setStatut(nouveauStatut);

        // 🔓 LIBÉRATION DES RESSOURCES SI LE TRAJET EST FINI OU ANNULÉ
        if ("TERMINE".equals(nouveauStatut) || "ANNULE".equals(nouveauStatut)) {
            if (trajet.getChauffeur() != null) {
                trajet.getChauffeur().setStatut("DISPONIBLE");
                userRepository.save(trajet.getChauffeur());
            }
            if (trajet.getVehicule() != null) {
                trajet.getVehicule().setStatut("DISPONIBLE");
                vehiculeRepository.save(trajet.getVehicule());
            }
        }

        trajetRepository.save(trajet);

        envoyerNotificationChauffeur(
                trajet.getChauffeur(),
                "Le statut de votre trajet vers " + trajet.getDestination() + " est passé à : " + nouveauStatut
        );
    }

    public Optional<Trajet> getTrajetActifChauffeur(Long chauffeurId) {
        return trajetRepository.findActiveTrajetByChauffeurId(chauffeurId);
    }

    public List<Trajet> getTrajetsDuJour(Long chauffeurId) {
        String jourActuel = LocalDate.now().getDayOfWeek()
                .getDisplayName(TextStyle.FULL, Locale.FRENCH).toUpperCase();

        return trajetRepository.findByChauffeurId(chauffeurId).stream()
                .filter(t -> {
                    if (t.getJoursSemaine() == null) return false;
                    String jours = t.getJoursSemaine().toUpperCase();
                    return jours.contains("TOUS") || jours.contains(jourActuel);
                })
                .collect(Collectors.toList());
    }

    /**
     * 🟢 DÉMARRER LE TRAJET (Déclenché par le chauffeur)
     */
    @Transactional
    public Trajet demarrerTrajet(Long trajetId) {
        Trajet trajet = trajetRepository.findById(trajetId)
                .orElseThrow(() -> new RuntimeException("Trajet introuvable"));

        // On passe le statut à EN_ROUTE
        trajet.setStatut("EN_ROUTE");

        // Optionnel : Notifier l'agence ou le chauffeur que le trajet a commencé
        envoyerNotificationChauffeur(
                trajet.getChauffeur(),
                "Bon voyage ! Le suivi GPS est activé pour votre trajet vers " + trajet.getDestination()
        );

        return trajetRepository.save(trajet);
    }

    /**
     * 📍 METTRE À JOUR LA LOCALISATION (Appelé toutes les minutes par le Frontend)
     */
    @Transactional
    public void mettreAJourLocalisation(Long trajetId, Double latitude, Double longitude) {
        Trajet trajet = trajetRepository.findById(trajetId)
                .orElseThrow(() -> new RuntimeException("Trajet introuvable"));

        // Sécurité : On met à jour les coordonnées UNIQUEMENT si le trajet est en cours
        if ("EN_ROUTE".equals(trajet.getStatut())) {
            trajet.setLatitudeActuelle(latitude);
            trajet.setLongitudeActuelle(longitude);

            // Note : le champ updatedAt sera automatiquement actualisé par Hibernate grâce à @UpdateTimestamp
            trajetRepository.save(trajet);
        }
    }
}