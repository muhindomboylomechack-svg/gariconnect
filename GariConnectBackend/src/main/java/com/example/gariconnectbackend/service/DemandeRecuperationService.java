


package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.dto.CotationRequest;
import com.example.gariconnectbackend.dto.DemandeRecuperationRequest;
import com.example.gariconnectbackend.model.*;
import com.example.gariconnectbackend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;


import com.example.gariconnectbackend.model.*;

import java.util.Optional;
@Service
public class DemandeRecuperationService {

    @Autowired
    private DemandeRecuperationRepository demandeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private PaiementRepository paiementRepository; // Assurez-vous que c'est injecté




    @Transactional
    public DemandeRecuperation creerDemande(DemandeRecuperationRequest request, String emailClient) {
        // 1. Récupérer le client connecté
        User client = userRepository.findByEmail(emailClient)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));

        // 2. Vérifier si la réservation existe
        Reservation reservation = reservationRepository.findById(request.getReservationId())
                .orElseThrow(() -> new RuntimeException("Réservation introuvable"));

        // 3. Forcer les valeurs par défaut pour éviter les NullPointerException plus tard
        DemandeRecuperation demande = DemandeRecuperation.builder()
                .client(client)
                .reservationId(request.getReservationId())
                .latitudeClient(request.getLatitudeClient())
                .longitudeClient(request.getLongitudeClient())
                .adresseTextuelle(request.getAdresseTextuelle())
                .pointRepereAgence("Non défini") // Sera rempli par l'agence
                .distanceEstimee(0.0)            // Sera calculé par l'agence
                .prixSupplementaire(0.0)         // Sera calculé par l'agence
                .statut(StatutRecuperation.EN_ATTENTE_COTATION) // ⏳ Étape 1 de votre logique
                .build();

        DemandeRecuperation demandeSauvegardee = demandeRepository.save(demande);

        // 4. Notifier l'agence qu'une nouvelle demande VIP est arrivée
        try {
            User agence = reservation.getTrajet().getAgence();
            if (agence != null) {
                String msg = "📍 Nouvelle demande de ramassage VIP à coter pour la réservation N°" + reservation.getId();
                envoyerNotification(msg, agence);
            }
        } catch (Exception e) {
            System.err.println("Erreur notification agence: " + e.getMessage());
        }

        return demandeSauvegardee;
    }
    @Transactional
    public DemandeRecuperation attribuerCotation(Long id, CotationRequest request) {
        DemandeRecuperation demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande introuvable"));

        // Injection des calculs faits par l'agence
        demande.setPointRepereAgence(request.getPointRepereAgence());
        demande.setDistanceEstimee(request.getDistanceEstimee());
        demande.setPrixSupplementaire(request.getPrixSupplementaire());

        // 🔥 Passage au statut suivant pour ouvrir le bouton de paiement côté client
        demande.setStatut(StatutRecuperation.EN_ATTENTE_PAIEMENT);

        DemandeRecuperation demandeMiseAJour = demandeRepository.save(demande);

        // 🔔 Notification au client pour lui dire que le prix est disponible !
        String messageClient = String.format(
                "💰 Le prix de votre ramassage a été fixé à %.2f FC. Vous pouvez maintenant procéder au paiement depuis votre historique.",
                request.getPrixSupplementaire()
        );
        envoyerNotification(messageClient, demande.getClient());

        return demandeMiseAJour;
    }


    /**
     * 🟢 Récupérer toutes les demandes de récupération d'un client par son email
     */
    public List<DemandeRecuperation> obtenirDemandesDuClient(String emailClient) {
        User client = userRepository.findByEmail(emailClient)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));
        return demandeRepository.findByClientId(client.getId());
    }

    /**
     * 🔍 Récupérer une demande de ramassage spécifique via l'ID de sa réservation
     * (Résout le problème de méthode manquante pour le contrôleur)
     */
    public Optional<DemandeRecuperation> obtenirDemandeParReservationId(Long reservationId) {
        return demandeRepository.findFirstByReservationId(reservationId);
    }

    /**
     * 🟢 Validation du paiement du surplus après un paiement réussi (Simulation / Webhook)
     */
    @Transactional
    public DemandeRecuperation validerPaiementRecuperation(Long id) {
        DemandeRecuperation demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande de récupération introuvable"));

        // Passage au statut payé
        demande.setStatut(StatutRecuperation.PAYE);

        // 🔔 Notification de confirmation au client
        String messageClient = String.format(
                "✅ Le paiement de votre ramassage à domicile pour la réservation N°%d a été validé avec succès !",
                demande.getReservationId()
        );
        envoyerNotification(messageClient, demande.getClient());

        return demandeRepository.save(demande);
    }

    /**
     * 4. CONSULTATION AGENT : Récupérer les demandes en attente de prix (pour le guichet)
     */
    public List<DemandeRecuperation> obtenirDemandesEnAttente() {
        return demandeRepository.findByStatut(StatutRecuperation.EN_ATTENTE_COTATION);
    }

    /**
     * 🛠️ Méthode utilitaire privée pour créer et sauvegarder une notification rapidement
     */
    private void envoyerNotification(String message, User destinataire) {
        if (destinataire != null) {
            Notification notification = new Notification();
            notification.setMessage(message);
            notification.setDate(LocalDateTime.now());
            notification.setLue(false);
            notification.setDestinataire(destinataire);

            notificationRepository.save(notification);
        }
    }


}





