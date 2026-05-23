/*package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.model.Trajet;
import com.example.gariconnectbackend.model.Vehicule;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.TrajetRepository;
import com.example.gariconnectbackend.repository.VehiculeRepository;
import com.example.gariconnectbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
import com.example.gariconnectbackend.exception.RessourceOccupeeException;


@Service
public class TrajetService {

    @Autowired private TrajetRepository trajetRepository;
    @Autowired private VehiculeRepository vehiculeRepository;
    @Autowired private UserRepository userRepository;


    // Dans TrajetService.java


    public List<User> listerChauffeursDisponibles(Long agenceId, java.time.LocalDate date) {
        List<Long> busyIds = trajetRepository.findBusyChauffeurIdsByDate(date);
        // On récupère les chauffeurs de l'agence qui ne sont pas dans la liste des occupés
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && "CHAUFFEUR".equals(u.getRole().name()))
                // Idéalement, filtrez aussi par agence si vous avez le champ agence_id dans User
                .filter(u -> !busyIds.contains(u.getId()))
                .toList();
    }

    // Ajoute ces méthodes dans TrajetService.java

    public List<Vehicule> listerVehiculesDisponibles(Long agenceId, java.time.LocalDate date) {
        // 1. On récupère les IDs des véhicules déjà pris ce jour-là
        List<Long> busyIds = trajetRepository.findBusyVehiculeIdsByDate(date);

        // 2. On retourne les véhicules de l'agence qui ne sont PAS dans la liste des occupés
        return vehiculeRepository.findByAgenceId(agenceId).stream()
                .filter(v -> busyIds == null || !busyIds.contains(v.getId()))
                .toList();
    }


    @Transactional
    public void mettreAJourStatut(Long trajetId, String nouveauStatut) {
        Trajet trajet = trajetRepository.findById(trajetId)
                .orElseThrow(() -> new RuntimeException("Trajet non trouvé"));
        trajet.setStatut(nouveauStatut);
        if ("TERMINE".equals(nouveauStatut) && trajet.getChauffeur() != null) {
            User chauffeur = trajet.getChauffeur();
            chauffeur.setStatut("DISPONIBLE");
            userRepository.save(chauffeur);
        }
        trajetRepository.save(trajet);
    }





        // Appliquez la même logique pour les méthodes par Date (LocalDate)
        public List<Vehicule> listerVehiculesDisponiblesParDate(Long agenceId, LocalDate date) {
            List<Long> busyIds = trajetRepository.findBusyVehiculeIdsByDate(date);
            List<Vehicule> tousLesVehicules = vehiculeRepository.findByAgenceId(agenceId);

            if (busyIds == null || busyIds.isEmpty()) return tousLesVehicules;

            return tousLesVehicules.stream()
                    .filter(v -> busyIds.stream().noneMatch(id -> id.longValue() == v.getId().longValue()))
                    .collect(Collectors.toList());
        }

        // ICI
        @Transactional
        public Trajet creerTrajet(Trajet trajet) {
            // 1. Récupération des données complètes
            Vehicule vehicule = vehiculeRepository.findById(trajet.getVehicule().getId())
                    .orElseThrow(() -> new RuntimeException("Véhicule introuvable"));
            User chauffeur = userRepository.findById(trajet.getChauffeur().getId())
                    .orElseThrow(() -> new RuntimeException("Chauffeur introuvable"));

            // 2. Vérification de la disponibilité (Jours Semaine)
            if (trajet.getJoursSemaine() != null && !trajet.getJoursSemaine().isEmpty()) {
                String jourCible = trajet.getJoursSemaine();

                // --- Vérif Chauffeur ---
                List<Long> chauffeursOccupes = trajetRepository.findBusyChauffeurIdsByDay(jourCible);
                if (chauffeursOccupes.stream().anyMatch(id -> id.equals(chauffeur.getId()))) {
                    throw new RessourceOccupeeException("Le chauffeur " + chauffeur.getNom() +
                            " est déjà occupé le " + jourCible + " ou possède un planning 'TOUS les jours'.");
                }

                // --- Vérif Véhicule ---
                List<Long> vehiculesOccupes = trajetRepository.findBusyVehiculeIdsByDay(jourCible);
                if (vehiculesOccupes.stream().anyMatch(id -> id.equals(vehicule.getId()))) {
                    throw new RessourceOccupeeException("Le véhicule " + vehicule.getPlaque_immatriculation() +
                            " est déjà utilisé le " + jourCible + " ou possède un planning 'TOUS les jours'.");
                }
            }

            // 3. Remplissage des données par défaut
            trajet.setVehicule(vehicule);
            trajet.setChauffeur(chauffeur);
            if (trajet.getPlacesDisponibles() == null) trajet.setPlacesDisponibles(vehicule.getCapacite());
            if (trajet.getStatut() == null) trajet.setStatut("PROGRAMME");

            return trajetRepository.save(trajet);
        }
    // --- AUTRES MÉTHODES DE LISTAGE (Gardées telles quelles pour la cohérence) ---

    public List<User> listerChauffeursDisponiblesParDate(Long agenceId, LocalDate date) {
        List<Long> busyIds = trajetRepository.findBusyChauffeurIdsByDate(date);
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && "CHAUFFEUR".equals(u.getRole().name()))
                .filter(u -> u.getAgenceEmployeur() != null && u.getAgenceEmployeur().getId().equals(agenceId))
                .filter(u -> busyIds == null || busyIds.stream().noneMatch(id -> ((Number) id).longValue() == u.getId().longValue()))
                .toList();
    }

    public List<Vehicule> listerVehiculesDisponiblesParJour(Long agenceId, String jour) {
        List<Long> busyIds = trajetRepository.findBusyVehiculeIdsByDay(jour);
        List<Vehicule> tousLesVehicules = vehiculeRepository.findByAgenceId(agenceId);
        if (busyIds == null || busyIds.isEmpty()) return tousLesVehicules;
        return tousLesVehicules.stream()
                .filter(v -> busyIds.stream().noneMatch(id -> id.longValue() == v.getId().longValue()))
                .collect(Collectors.toList());
    }

    public List<User> listerChauffeursDisponiblesParJour(Long agenceId, String jour) {
        List<Long> busyIds = trajetRepository.findBusyChauffeurIdsByDay(jour);
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && "CHAUFFEUR".equals(u.getRole().name()))
                .filter(u -> u.getAgenceEmployeur() != null && u.getAgenceEmployeur().getId().equals(agenceId))
                .filter(u -> busyIds == null || busyIds.stream().noneMatch(id -> id.longValue() == u.getId().longValue()))
                .collect(Collectors.toList());
    }

}
*/
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
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import com.example.gariconnectbackend.exception.RessourceOccupeeException;



import java.time.format.TextStyle;
import java.util.Locale;

@Service
public class TrajetService {

    @Autowired private TrajetRepository trajetRepository;
    @Autowired private VehiculeRepository vehiculeRepository;
    @Autowired private UserRepository userRepository;

    // ✅ INJECTION DU REPOSITORY DE NOTIFICATIONS
    @Autowired private NotificationRepository notificationRepository;

    /**
     * ✅ MÉTHODE CENTRALE POUR NOTIFIER LE CHAUFFEUR
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

    public List<User> listerChauffeursDisponibles(Long agenceId, java.time.LocalDate date) {
        List<Long> busyIds = trajetRepository.findBusyChauffeurIdsByDate(date);
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && "CHAUFFEUR".equals(u.getRole().name()))
                .filter(u -> !busyIds.contains(u.getId()))
                .toList();
    }

    public List<Vehicule> listerVehiculesDisponibles(Long agenceId, java.time.LocalDate date) {
        List<Long> busyIds = trajetRepository.findBusyVehiculeIdsByDate(date);
        return vehiculeRepository.findByAgenceId(agenceId).stream()
                .filter(v -> busyIds == null || !busyIds.contains(v.getId()))
                .toList();
    }

    @Transactional
    public void mettreAJourStatut(Long trajetId, String nouveauStatut) {
        Trajet trajet = trajetRepository.findById(trajetId)
                .orElseThrow(() -> new RuntimeException("Trajet non trouvé"));

        trajet.setStatut(nouveauStatut);

        if ("TERMINE".equals(nouveauStatut) && trajet.getChauffeur() != null) {
            User chauffeur = trajet.getChauffeur();
            chauffeur.setStatut("DISPONIBLE");
            userRepository.save(chauffeur);
        }

        trajetRepository.save(trajet);

        // ✅ NOTIFICATION : Changement de statut
        envoyerNotificationChauffeur(
                trajet.getChauffeur(),
                "Le statut de votre trajet vers " + trajet.getDestination() + " est passé à : " + nouveauStatut
        );
    }


    @Transactional
    public Trajet creerTrajet(Trajet trajet) {
        Vehicule vehicule = vehiculeRepository.findById(trajet.getVehicule().getId())
                .orElseThrow(() -> new RuntimeException("Véhicule introuvable"));
        User chauffeur = userRepository.findById(trajet.getChauffeur().getId())
                .orElseThrow(() -> new RuntimeException("Chauffeur introuvable"));

        if (trajet.getJoursSemaine() != null && !trajet.getJoursSemaine().isEmpty()) {
            String jourCible = trajet.getJoursSemaine();

            List<Long> chauffeursOccupes = trajetRepository.findBusyChauffeurIdsByDay(jourCible);
            if (chauffeursOccupes.stream().anyMatch(id -> id.equals(chauffeur.getId()))) {
                throw new RessourceOccupeeException("Le chauffeur " + chauffeur.getNom() +
                        " est déjà occupé le " + jourCible + " ou possède un planning 'TOUS les jours'.");
            }

            List<Long> vehiculesOccupes = trajetRepository.findBusyVehiculeIdsByDay(jourCible);
            if (vehiculesOccupes.stream().anyMatch(id -> id.equals(vehicule.getId()))) {
                throw new RessourceOccupeeException("Le véhicule " + vehicule.getPlaque_immatriculation() +
                        " est déjà utilisé le " + jourCible + " ou possède un planning 'TOUS les jours'.");
            }
        }

        trajet.setVehicule(vehicule);
        trajet.setChauffeur(chauffeur);
        if (trajet.getPlacesDisponibles() == null) trajet.setPlacesDisponibles(vehicule.getCapacite());
        if (trajet.getStatut() == null) trajet.setStatut("PROGRAMME");

        Trajet nouveauTrajet = trajetRepository.save(trajet);

        // ✅ NOTIFICATION : Nouvelle assignation
        envoyerNotificationChauffeur(
                chauffeur,
                "Nouvelle mission assignée : " + trajet.getDepart() + " ➔ " + trajet.getDestination() + " (" + trajet.getJoursSemaine() + ")"
        );

        return nouveauTrajet;
    }



    // Trouver le trajet actif du chauffeur
    public Optional<Trajet> getTrajetActifChauffeur(Long chauffeurId) {
        return trajetRepository.findActiveTrajetByChauffeurId(chauffeurId);
    }

    // Mettre à jour le statut du trajet
    public Trajet updateStatutTrajet(Long trajetId, String nouveauStatut) {
        Trajet trajet = trajetRepository.findById(trajetId)
                .orElseThrow(() -> new EntityNotFoundException("Trajet non trouvé avec l'ID : " + trajetId));

        // Validation basique des transitions de statut (Optionnel mais recommandé)
        String statutActuel = trajet.getStatut();
        if ("TERMINE".equals(statutActuel)) {
            throw new IllegalStateException("Impossible de modifier le statut d'un trajet déjà terminé.");
        }

        trajet.setStatut(nouveauStatut);
        return trajetRepository.save(trajet);
    }


    // icic


    public List<Vehicule> listerVehiculesDisponiblesParDate(Long agenceId, LocalDate date) {
        List<Long> busyIds = trajetRepository.findBusyVehiculeIdsByDate(date);
        List<Vehicule> tousLesVehicules = vehiculeRepository.findByAgenceId(agenceId);
        if (busyIds == null || busyIds.isEmpty()) return tousLesVehicules;
        return tousLesVehicules.stream()
                .filter(v -> busyIds.stream().noneMatch(id -> id.longValue() == v.getId().longValue()))
                .collect(Collectors.toList());
    }

    public List<User> listerChauffeursDisponiblesParDate(Long agenceId, LocalDate date) {
        List<Long> busyIds = trajetRepository.findBusyChauffeurIdsByDate(date);
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && "CHAUFFEUR".equals(u.getRole().name()))
                .filter(u -> u.getAgenceEmployeur() != null && u.getAgenceEmployeur().getId().equals(agenceId))
                .filter(u -> busyIds == null || busyIds.stream().noneMatch(id -> id.longValue() == u.getId().longValue()))
                .collect(Collectors.toList());
    }

    public List<Vehicule> listerVehiculesDisponiblesParJour(Long agenceId, String jour) {
        List<Long> busyIds = trajetRepository.findBusyVehiculeIdsByDay(jour);
        List<Vehicule> tousLesVehicules = vehiculeRepository.findByAgenceId(agenceId);
        if (busyIds == null || busyIds.isEmpty()) return tousLesVehicules;
        return tousLesVehicules.stream()
                .filter(v -> busyIds.stream().noneMatch(id -> id.longValue() == v.getId().longValue()))
                .collect(Collectors.toList());
    }

    public List<User> listerChauffeursDisponiblesParJour(Long agenceId, String jour) {
        List<Long> busyIds = trajetRepository.findBusyChauffeurIdsByDay(jour);
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() != null && "CHAUFFEUR".equals(u.getRole().name()))
                .filter(u -> u.getAgenceEmployeur() != null && u.getAgenceEmployeur().getId().equals(agenceId))
                .filter(u -> busyIds == null || busyIds.stream().noneMatch(id -> id.longValue() == u.getId().longValue()))
                .collect(Collectors.toList());
    }

    @Transactional
    public Trajet creerTrajet(Trajet trajet, Long agenceId) {
        User agence = userRepository.findById(agenceId)
                .orElseThrow(() -> new EntityNotFoundException("Agence introuvable"));
        trajet.setAgence(agence);
        trajet.setStatut("DISPONIBLE");

        if (trajet.getVehicule() != null && trajet.getDateHeureDepart() != null) {
            if (trajetRepository.isVehiculeOccupeADate(trajet.getVehicule().getId(), trajet.getDateHeureDepart())) {
                throw new RessourceOccupeeException("Ce véhicule est déjà affecté à un autre trajet ce jour-là.");
            }
        }

        if (trajet.getChauffeur() != null && trajet.getDateHeureDepart() != null) {
            if (trajetRepository.isChauffeurOccupeADate(trajet.getChauffeur().getId(), trajet.getDateHeureDepart())) {
                throw new RessourceOccupeeException("Ce chauffeur est déjà occupé sur un autre trajet ce jour-là.");
            }
        }

        return trajetRepository.save(trajet);
    }

    @Transactional
    public Trajet modifierTrajet(Long id, Trajet trajetDetails, Long agenceId) {
        Trajet trajet = trajetRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Trajet introuvable"));

        if (!trajet.getAgence().getId().equals(agenceId)) {
            throw new SecurityException("Vous n'êtes pas autorisé à modifier ce trajet.");
        }

        trajet.setDepart(trajetDetails.getDepart());
        trajet.setDestination(trajetDetails.getDestination());
        trajet.setDateHeureDepart(trajetDetails.getDateHeureDepart());
        trajet.setJoursSemaine(trajetDetails.getJoursSemaine());
        trajet.setPrix(trajetDetails.getPrix());
        trajet.setPlacesDisponibles(trajetDetails.getPlacesDisponibles());
        trajet.setVehicule(trajetDetails.getVehicule());
        trajet.setChauffeur(trajetDetails.getChauffeur());

        if (trajetDetails.getStatut() != null) {
            trajet.setStatut(trajetDetails.getStatut());
        }

        return trajetRepository.save(trajet);
    }

    @Transactional
    public void supprimerTrajet(Long id, Long agenceId) {
        Trajet trajet = trajetRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Trajet introuvable"));

        if (!trajet.getAgence().getId().equals(agenceId)) {
            throw new SecurityException("Vous n'êtes pas autorisé à supprimer ce trajet.");
        }

        trajetRepository.delete(trajet);
    }

    public List<Trajet> getTrajetsDuJour(Long chauffeurId) {
        // 1. Obtenir le jour actuel en français (ex: "LUNDI")
        String jourActuel = LocalDate.now().getDayOfWeek()
                .getDisplayName(TextStyle.FULL, Locale.FRENCH).toUpperCase();

        // 2. Récupérer tous les trajets du chauffeur
        List<Trajet> tousLesTrajets = trajetRepository.findByChauffeurId(chauffeurId);

        // 3. Filtrer :
        // - Si "TOUS" ou "TOUS LES JOURS" -> affiché
        // - Sinon -> vérifier si le jour actuel est dans la chaîne des jours
        return tousLesTrajets.stream()
                .filter(t -> {
                    if (t.getJoursSemaine() == null) return false;
                    String jours = t.getJoursSemaine().toUpperCase();
                    return jours.contains("TOUS") || jours.contains(jourActuel);
                })
                .collect(Collectors.toList());
    }
}

// ... dans votre classe TrajetService ...
