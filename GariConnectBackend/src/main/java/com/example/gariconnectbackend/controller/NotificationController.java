package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.model.Notification;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.NotificationRepository;
import com.example.gariconnectbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin("*")
public class NotificationController {

    @Autowired private NotificationRepository notificationRepository;
    @Autowired private UserRepository userRepository;

    @GetMapping("/mes-notifications")
    public ResponseEntity<?> getMesNotifications() {
        System.out.println("====== DÉBUT REQUÊTE MES-NOTIFICATIONS ======");
        try {
            // 1. Récupération de l'authentification (Spring Security stocke l'email ici)
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null) {
                System.err.println("-> AUTHENTIFICATION EST NULL !");
                return ResponseEntity.status(401).body("Non authentifié");
            }

            String emailUtilisateur = auth.getName();
            System.out.println("-> Email extrait du token connecté : " + emailUtilisateur);

            // 2. Recherche de l'utilisateur par son EMAIL
            User user = userRepository.findByEmail(emailUtilisateur).orElse(null);

            if (user == null) {
                System.err.println("-> UTILISATEUR INTROUVABLE EN BASE POUR L'EMAIL : " + emailUtilisateur);
                return ResponseEntity.status(404).body("Utilisateur non trouvé avec l'email : " + emailUtilisateur);
            }
            System.out.println("-> Utilisateur connecté trouvé : ID " + user.getId() + " - Nom : " + user.getNom());

            // 3. Récupération des notifications liées à cet ID utilisateur
            List<Notification> notifications = notificationRepository.findByDestinataireOrderByDateDesc(user);
            System.out.println("-> Nombre de notifications trouvées pour " + user.getNom() + " : " + notifications.size());

            System.out.println("====== FIN RÉUSSIE ======");
            return ResponseEntity.ok(notifications);

        } catch (Exception e) {
            System.err.println("!!! CRASH INTERCEPTÉ !!!");
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erreur serveur : " + e.getMessage());
        }
    }
    // ==========================================
    // MARQUER UNE NOTIFICATION SPÉCIFIQUE COMME LUE
    // ==========================================
    @PutMapping("/marquer-lue/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'AGENCY_ADMIN', 'AGENCY_MANAGER', 'CHAUFFEUR', 'CLIENT', 'USER')")
    public ResponseEntity<?> marquerCommeLue(@PathVariable Long id) {
        try {
            // 1. Vérifier si la notification existe
            Notification notification = notificationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Notification introuvable avec l'ID : " + id));

            // 2. Modifier le statut de lecture
            notification.setLue(true);
            notificationRepository.save(notification);

            return ResponseEntity.ok(Map.of(
                    "message", "Notification marquée comme lue avec succès !",
                    "id", id,
                    "lue", true
            ));
        } catch (Exception e) {
            System.err.println("❌ Erreur lors du marquage de la notification : " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Erreur lors du traitement : " + e.getMessage()
            ));
        }
    }

    // ==========================================
    // NOUVEAUTÉ 1 : SUPPRIMER UNE NOTIFICATION UNIQUE
    // ==========================================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> supprimerNotification(@PathVariable Long id) {
        try {
            if (!notificationRepository.existsById(id)) {
                return ResponseEntity.status(404).body("Notification introuvable");
            }
            notificationRepository.deleteById(id);
            return ResponseEntity.ok().body("Notification supprimée avec succès");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur lors de la suppression : " + e.getMessage());
        }
    }

    // ==========================================
    // NOUVEAUTÉ 2 : BALAYER TOUTES LES NOTIFICATIONS LUES
    // ==========================================
    @DeleteMapping("/nettoyer-lus")
    public ResponseEntity<?> balayerNotificationsLues() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null) return ResponseEntity.status(401).body("Non authentifié");

            String email = auth.getName();
            User user = userRepository.findByEmail(email).orElse(null);

            if (user == null) return ResponseEntity.status(404).body("Utilisateur non trouvé");

            // Appel de la méthode de suppression personnalisée
            notificationRepository.deleteByDestinataireAndLueTrue(user);

            return ResponseEntity.ok().body("Toutes les notifications lues ont été balayées");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur lors du balayage : " + e.getMessage());
        }
    }
}