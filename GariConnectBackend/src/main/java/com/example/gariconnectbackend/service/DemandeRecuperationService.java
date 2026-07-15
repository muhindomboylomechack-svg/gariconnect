


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
import com.example.gariconnectbackend.repository.*;

import java.util.ArrayList;
import java.util.HashMap;

import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import com.example.gariconnectbackend.model.*;

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

    // 🔥 INJECTION AJOUTÉE POUR VÉRIFIER LE TRAJET DU CHAUFFEUR
    @Autowired private TrajetRepository trajetRepository;


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
//
//    /**
//     * 4. CONSULTATION AGENT : Récupérer les demandes en attente de prix (pour le guichet)
//     */
//    public List<DemandeRecuperation> obtenirDemandesEnAttente() {
//        return demandeRepository.findByStatut(StatutRecuperation.EN_ATTENTE_COTATION);
//    }

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
//
//
//    /**
//     * CONSULTATION AGENT : Récupérer l'historique des demandes traitées (Cotées ou Payées)
//     */
//    public List<DemandeRecuperation> obtenirHistoriqueTraitees() {
//        // On récupère les demandes qui ne sont plus en attente de cotation
//        return demandeRepository.findByStatutIn(
//                java.util.Arrays.asList(
//                        StatutRecuperation.EN_ATTENTE_PAIEMENT,
//                        StatutRecuperation.PAYE,
//                        StatutRecuperation.EFFECTUE
//                )
//        );
//    }
    /**
     * ❌ SUPPRIMER/ANNULER UNE DEMANDE DE RÉCUPÉRATION
     */
    @Transactional
    public void supprimerDemande(Long id) {
        DemandeRecuperation demande = demandeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Demande de ramassage introuvable avec l'ID : " + id));

        // 🔔 Notification au client pour l'informer de l'annulation
        if (demande.getClient() != null) {
            String messageClient = String.format(
                    "❌ Votre demande de ramassage à domicile pour la réservation N°%d a été annulée par l'agence.",
                    demande.getReservationId()
            );
            envoyerNotification(messageClient, demande.getClient());
        }

        demandeRepository.delete(demande);
        System.out.println("🗑️ [VIP] Demande de ramassage N°" + id + " supprimée avec succès.");
    }


    // =========================================================================================
    // 🔥 ÉTAPE 5 : PRÉPARER LA LISTE DE NAVIGATION POUR LE CHAUFFEUR (Sécurité Améliorée)
    // =========================================================================================
    public List<Map<String, Object>> obtenirRamassagesVIPPourChauffeur(Long trajetId, String emailConnecte) {
        Trajet trajet = trajetRepository.findById(trajetId)
                .orElseThrow(() -> new RuntimeException("Trajet introuvable"));

        User utilisateurConnecte = userRepository.findByEmail(emailConnecte)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        // Sécurité blindée : On compare les IDs plutôt que les emails pour éviter les bugs de casse
        if (utilisateurConnecte.getRole() == Role.CHAUFFEUR) {
            if (trajet.getChauffeur() == null || !trajet.getChauffeur().getId().equals(utilisateurConnecte.getId())) {
                throw new RuntimeException("Accès refusé : Ce trajet est assigné à un autre chauffeur.");
            }
        }

        // 1. Trouver toutes les réservations valides (payées) pour ce trajet
        List<Reservation> reservationsValides = reservationRepository.findByTrajetId(trajetId).stream()
                .filter(r -> "PAYE".equals(r.getStatut()) || "CONFIRMEE".equals(r.getStatut()))
                .collect(Collectors.toList());

        List<Long> reservationIds = reservationsValides.stream()
                .map(Reservation::getId)
                .collect(Collectors.toList());

        if (reservationIds.isEmpty()) return new ArrayList<>();

        // 2. Récupérer uniquement les demandes VIP payées associées à ces réservations
        List<DemandeRecuperation> demandesVIP = demandeRepository.findByReservationIdInAndStatut(
                reservationIds, StatutRecuperation.PAYE
        );

        // 3. Formater les données pour l'application du chauffeur (GPS, Contacts, etc.)
        return demandesVIP.stream().map(demande -> {
            Reservation res = reservationsValides.stream()
                    .filter(r -> r.getId().equals(demande.getReservationId()))
                    .findFirst().orElse(null);

            Map<String, Object> data = new HashMap<>();
            data.put("demandeId", demande.getId());
            data.put("reservationId", demande.getReservationId());
            data.put("codeTicket", res != null ? res.getCodeTicket() : "N/A");
            data.put("numeroSiege", res != null ? res.getNumeroSiege() : "N/A");

            String nomComplet = demande.getClient().getNom() + " " + (demande.getClient().getPrenom() != null ? demande.getClient().getPrenom() : "");
            data.put("clientNom", nomComplet);
            data.put("clientTelephone", demande.getClient().getTelephone());

            // Extraction locale pour la lisibilité de la construction de l'URL
            Double lat = demande.getLatitudeClient();
            Double lng = demande.getLongitudeClient();
            String adresse = demande.getAdresseTextuelle();

            // Les coordonnées cruciales pour l'ouverture de Google Maps côté React
            data.put("latitude", lat);
            data.put("longitude", lng);
            data.put("adresseTextuelle", adresse);
            data.put("pointRepere", demande.getPointRepereAgence());

            // ✨ NOUVEAU : Génération intelligente du lien Google Maps (API universelle)
            String googleMapsUrl = "";
            if (lat != null && lng != null && lat != 0.0 && lng != 0.0) {
                // Priorité 1 : Mode Itinéraire direct (Idéal pour le chauffeur sur la route)
                googleMapsUrl = "https://www.google.com/maps/dir/?api=1&destination=" + lat + "," + lng;
            } else if (adresse != null && !adresse.trim().isEmpty()) {
                // Priorité 2 : Repli vers la recherche textuelle de l'adresse si les coordonnées GPS manquent
                String encodedAddress = adresse.replace(" ", "+");
                googleMapsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodedAddress;
            }
            data.put("googleMapsUrl", googleMapsUrl);

            return data;
        }).collect(Collectors.toList());
    }

    /**
     * CONSULTATION AGENT : Récupérer les demandes en attente de prix (pour le guichet)
     */
    public List<DemandeRecuperation> obtenirDemandesEnAttente(String emailConnecte, boolean isSuperAdmin) {
        if (isSuperAdmin) {
            return demandeRepository.findByStatut(StatutRecuperation.EN_ATTENTE_COTATION);
        } else {
            User user = userRepository.findByEmail(emailConnecte)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            User agence = (user.getAgenceEmployeur() != null) ? user.getAgenceEmployeur() : user;

            return demandeRepository.findByStatutAndReservation_Trajet_Agence(StatutRecuperation.EN_ATTENTE_COTATION, agence);
        }
    }

    /**
     * CONSULTATION AGENT : Récupérer l'historique des demandes traitées (Cotées ou Payées)
     */
    public List<DemandeRecuperation> obtenirHistoriqueTraitees(String emailConnecte, boolean isSuperAdmin) {
        List<StatutRecuperation> statutsTraites = java.util.Arrays.asList(
                StatutRecuperation.EN_ATTENTE_PAIEMENT,
                StatutRecuperation.PAYE,
                StatutRecuperation.EFFECTUE
        );

        if (isSuperAdmin) {
            return demandeRepository.findByStatutIn(statutsTraites);
        } else {
            User user = userRepository.findByEmail(emailConnecte)
                    .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
            User agence = (user.getAgenceEmployeur() != null) ? user.getAgenceEmployeur() : user;

            return demandeRepository.findByStatutInAndReservation_Trajet_Agence(statutsTraites, agence);
        }
    }
}





