package com.example.gariconnectbackend.service;


import com.example.gariconnectbackend.model.Reservation;
import com.example.gariconnectbackend.model.Trajet;
import com.example.gariconnectbackend.model.Vehicule;
import com.example.gariconnectbackend.repository.ReservationRepository;
import com.example.gariconnectbackend.repository.TrajetRepository;
import com.example.gariconnectbackend.repository.VehiculeRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ReservationService {


    @Autowired
    private TrajetRepository trajetRepository;
    @Autowired
    private ReservationRepository reservationRepository;

    // AJOUTE CETTE LIGNE CI-DESSOUS POUR ENLEVER LE ROUGE :
    @Autowired
    private VehiculeRepository vehiculeRepository;

    // ... ensuite vient ta méthode creerReservation


    @Transactional
    public Reservation creerReservation(Reservation reservation) {
        Trajet trajet = trajetRepository.findById(reservation.getTrajet().getId())
                .orElseThrow(() -> new RuntimeException("Trajet introuvable"));

        if (trajet.getPlacesDisponibles() <= 0) {
            throw new RuntimeException("Bus complet !");
        }

        // --- GÉNÉRATION DU CODE TICKET ---
        // On prend les 5 premiers caractères d'un identifiant unique
        String code = "GARI-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase();
        reservation.setCodeTicket(code);
        reservation.setStatut("EN_ATTENTE_PAIEMENT");

        // Mise à jour des places
        trajet.setPlacesDisponibles(trajet.getPlacesDisponibles() - 1);
        trajetRepository.save(trajet);

        return reservationRepository.save(reservation);
    }
/*
    @Transactional // Très important pour éviter les erreurs de calcul si 2 personnes cliquent en même temps
    public Reservation creerReservation(Reservation reservation) {
        // 1. Récupérer le trajet complet depuis la base de données
        Trajet trajet = trajetRepository.findById(reservation.getTrajet().getId())
                .orElseThrow(() -> new RuntimeException("Trajet introuvable"));

        // 2. Vérifier s'il reste au moins une place
        if (trajet.getPlacesDisponibles() == null || trajet.getPlacesDisponibles() <= 0) {
            throw new RuntimeException("Désolé, ce trajet est complet. Plus de places disponibles.");
        }

        // 3. Déduire une place
        trajet.setPlacesDisponibles(trajet.getPlacesDisponibles() - 1);
        trajetRepository.save(trajet); // On met à jour le trajet en base de données

        // 4. Enregistrer la réservation
        return reservationRepository.save(reservation);
    }
*/
    public List<Reservation> listerToutes() {
        return reservationRepository.findAll();
    }

    public List<Reservation> recupererParClient(Long clientId) {
        return reservationRepository.findByClientId(clientId);
    }
}