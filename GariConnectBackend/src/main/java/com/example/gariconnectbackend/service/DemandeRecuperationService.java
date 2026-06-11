package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.dto.CotationRequest;
import com.example.gariconnectbackend.dto.DemandeRecuperationRequest;
import com.example.gariconnectbackend.model.*;
        import com.example.gariconnectbackend.repository.DemandeRecuperationRepository;
import com.example.gariconnectbackend.repository.NotificationRepository;
import com.example.gariconnectbackend.repository.ReservationRepository;
import com.example.gariconnectbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

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

    /**
     * 1. CRÉATION : Permet à un client de soumettre une demande de ramassage à domicile
     */
    @Transactional
    public DemandeRecuperation creerDemandeRecuperation(DemandeRecuperationRequest request, String emailClient) {
        User client = userRepository.findByEmail(emailClient)
                .orElseThrow(() -> new RuntimeException("Client non trouvé avec l'email : " + emailClient));

        // Vérification si une demande existe déjà pour cette réservation
        demandeRepository.findByReservationId(request.getReservationId()).ifPresent(d -> {
            throw new RuntimeException("Une demande de récupération existe déjà pour cette réservation.");
        });

        DemandeRecuperation demande = DemandeRecuperation.builder()
                .client(client)
                .reservationId(request.getReservationId())
                .latitudeClient(request.getLatitudeClient())
                .longitudeClient(request.getLongitudeClient())
                .adresseTextuelle(request.getAdresseTextuelle())
                .statut(StatutRecuperation.EN_ATTENTE_COTATION)
                .build();

        return demandeRepository.save(demande);
    }

    /**
     * 2. COTATION : Un agent fixe le prix et le point de repère.
     * Met à jour le montant et passe la réservation au statut "ATTENTE_PAIEMENT_SURPLUS".
     */
    @Transactional
    public DemandeRecuperation attribuerCotation(Long id, CotationRequest request) {
        DemandeRecuperation demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande de récupération introuvable"));

        // Mise à jour des informations fournies par l'agence
        demande.setPointRepereAgence(request.getPointRepereAgence());
        demande.setDistanceEstimee(request.getDistanceEstimee());
        demande.setPrixSupplementaire(request.getPrixSupplementaire());
        demande.setStatut(StatutRecuperation.EN_ATTENTE_PAIEMENT);

        Reservation reservation = reservationRepository.findById(demande.getReservationId())
                .orElseThrow(() -> new RuntimeException("Réservation N°" + demande.getReservationId() + " introuvable"));

        // 🔥 SECURITÉ ANTI-NULL : Évite le NullPointerException si le montant initial ou le supplément est NULL
        Double montantInitial = (reservation.getMontantPaye() != null) ? reservation.getMontantPaye() : 0.0;
        Double supplement = (request.getPrixSupplementaire() != null) ? request.getPrixSupplementaire() : 0.0;

        // Calcul et mise à jour du montant total de la réservation
        Double prixTotalFinal = montantInitial + supplement;
        reservation.setMontantPaye(prixTotalFinal);

        // 🔥 MODIFICATION : Passage au statut spécifique pour le flux de paiement du surplus
        reservation.setStatut("ATTENTE_PAIEMENT_SURPLUS");
        reservationRepository.save(reservation);

        // 🔔 ENVOI DE LA NOTIFICATION AU PASSAGER
        User passager = demande.getClient();
        if (passager != null) {
            String messagePassager = String.format(
                    "💰 Votre demande de ramassage pour la réservation N°%d a été cotée. Supplément : %,.0f FC. Point de repère : %s. Vous pouvez maintenant procéder au paiement.",
                    reservation.getId(), supplement, demande.getPointRepereAgence()
            );
            envoyerNotification(messagePassager, passager);
        }

        return demandeRepository.save(demande);
    }

    /**
     * 3. VALIDATION PAIEMENT : Méthode appelée après le paiement réussi du surplus.
     * Notifie l'agence et assigne formellement la mission au chauffeur.
     */
    @Transactional
    public DemandeRecuperation validerPaiementRecuperation(Long id) {
        DemandeRecuperation demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande de récupération introuvable"));

        demande.setStatut(StatutRecuperation.VALIDE);
        DemandeRecuperation demandeValidee = demandeRepository.save(demande);

        Reservation reservation = reservationRepository.findById(demande.getReservationId())
                .orElseThrow(() -> new RuntimeException("Réservation associée introuvable"));

        // Optionnel : Mettre également à jour le statut global de la réservation si requis par votre logique métier
        // reservation.setStatut("EMBARQUEMENT_VALIDE");
        // reservationRepository.save(reservation);

        // 🔔 NOTIFICATION POUR L'AGENCE
        User agence = reservation.getTrajet().getAgence();
        String messageAgence = String.format(
                "✅ Paiement du ramassage validé pour la réservation N°%d (Client : %s).",
                reservation.getId(), demande.getClient().getNom()
        );
        envoyerNotification(messageAgence, agence);

        // 🔔 NOTIFICATION POUR LE CHAUFFEUR : Mission de déviation de route
        User chauffeur = reservation.getTrajet().getChauffeur();
        if (chauffeur != null) {
            String messageChauffeur = String.format(
                    "🚐 Mission de ramassage : Vous devez récupérer le passager %s à l'adresse suivante : %s (Coordonnées dispo sur votre carte).",
                    demande.getClient().getNom(), demande.getAdresseTextuelle()
            );
            envoyerNotification(messageChauffeur, chauffeur);
        }

        return demandeValidee;
    }

    /**
     * 4. CONSULTATION AGENT : Récupérer les demandes en attente de prix (pour le guichet)
     */
    public List<DemandeRecuperation> obtenirDemandesEnAttente() {
        return demandeRepository.findByStatut(StatutRecuperation.EN_ATTENTE_COTATION);
    }

    /**
     * 5. CONSULTATION CLIENT : Voir l'historique personnel d'un client connecté
     */
    public List<DemandeRecuperation> obtenirDemandesDuClient(String emailClient) {
        User client = userRepository.findByEmail(emailClient)
                .orElseThrow(() -> new RuntimeException("Client non trouvé avec l'email : " + emailClient));

        return demandeRepository.findByClientId(client.getId());
    }
    // 1. Un client crée une demande de récupération (Généré depuis React)
    public DemandeRecuperation creerDemande(DemandeRecuperationRequest request, String emailClient) {
        User client = userRepository.findByEmail(emailClient)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));

        DemandeRecuperation demande = DemandeRecuperation.builder()
                .client(client)
                .reservationId(request.getReservationId())
                .latitudeClient(request.getLatitudeClient())
                .longitudeClient(request.getLongitudeClient())
                .adresseTextuelle(request.getAdresseTextuelle())
                .statut(StatutRecuperation.EN_ATTENTE_COTATION) // ⏳ Statut initial
                .build();

        // 🔔 ENVOI DE LA NOTIFICATION À L'AGENCE
        Reservation reservation = reservationRepository.findById(request.getReservationId())
                .orElseThrow(() -> new RuntimeException("Réservation introuvable"));

        User agence = reservation.getTrajet().getAgence();
        if (agence != null) {
            String messageAgence = String.format(
                    "📍 Nouvelle demande de ramassage à domicile pour la réservation N°%d de %s.",
                    reservation.getId(), client.getNom()
            );
            envoyerNotification(messageAgence, agence);
        }

        return demandeRepository.save(demande);
    }
}