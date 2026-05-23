package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.dto.EvaluationRequestDTO;
import com.example.gariconnectbackend.model.Evaluation;
import com.example.gariconnectbackend.model.Reservation;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.EvaluationRepository;
import com.example.gariconnectbackend.repository.ReservationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EvaluationService {

    @Autowired
    private EvaluationRepository evaluationRepository;

    @Autowired
    private ReservationRepository reservationRepository;



    public Map<String, Object> genererRapportChauffeur(Long chauffeurId) {
        Map<String, Object> stats = new HashMap<>();

        // Calcul des moyennes spécifiques au chauffeur
        Double moyGlobale = evaluationRepository.getMoyenneGlobaleChauffeur(chauffeurId);
        Double moyConduite = evaluationRepository.getMoyenneConduiteChauffeur(chauffeurId);
        Double moyPonctualite = evaluationRepository.getMoyennePonctualiteChauffeur(chauffeurId);

        // Formatage pour le frontend (ex: 4.9/5 ou 98%)
        stats.put("noteGlobale", moyGlobale != null ? Math.round(moyGlobale * 10.0) / 10.0 : 0.0);
        stats.put("scoreSecurite", moyConduite != null ? (int)(moyConduite * 20) : 0); // Converti en %
        stats.put("scorePonctualite", moyPonctualite != null ? (int)(moyPonctualite * 20) : 0);

        // Récupération des avis textuels
        stats.put("commentaires", evaluationRepository.findByChauffeurIdOrderByDateEvaluationDesc(chauffeurId));

        return stats;
    }

    private Double calculateAverageConduite() {
        return evaluationRepository.findAll().stream()
                .filter(e -> e.getNoteConduite() != null)
                .mapToDouble(Evaluation::getNoteConduite)
                .average().orElse(0.0);
    }

    private Double calculateAverageConfort() {
        return evaluationRepository.findAll().stream()
                .filter(e -> e.getNoteConfort() != null)
                .mapToDouble(Evaluation::getNoteConfort)
                .average().orElse(0.0);
    }

    private Double calculateAveragePonctualite() {
        return evaluationRepository.findAll().stream()
                .filter(e -> e.getNotePonctualite() != null)
                .mapToDouble(Evaluation::getNotePonctualite)
                .average().orElse(0.0);
    }
    /**
     * Méthode synchronisée avec le dashboard Frontend.
     * Calcule les KPIs et récupère le journal complet des avis.
     */
    public Map<String, Object> genererRapportPerformance() {
        Map<String, Object> stats = new HashMap<>();

        // 1. Récupération des moyennes globales via le repository (plus performant)
        Double moyGlobale = evaluationRepository.getMoyenneGlobaleAgence();
        Double moyConduite = evaluationRepository.getMoyenneConduiteGlobale();
        Double moyConfort = evaluationRepository.getMoyenneConfortGlobale();
        Double moyPonctualite = evaluationRepository.getMoyennePonctualiteGlobale();

        // 2. Remplissage des statistiques (protection contre le null si base vide)
        stats.put("satisfactionGlobale", moyGlobale != null ? moyGlobale : 0.0);
        stats.put("moyenneConduite", moyConduite != null ? moyConduite : 0.0);
        stats.put("moyenneConfort", moyConfort != null ? moyConfort : 0.0);
        stats.put("moyennePonctualite", moyPonctualite != null ? moyPonctualite : 0.0);

        // 3. Récupération des alertes critiques (Note < 3)
        List<Evaluation> alertes = evaluationRepository.findByNoteGlobaleLessThanOrderByDateEvaluationDesc(3);
        stats.put("alertesCritiques", alertes);

        // 4. NOUVEAUTÉ : Récupération de TOUTES les évaluations pour le journal détaillé
        // Cette clé "allEvaluations" est celle attendue par ton code React
        List<Evaluation> toutesLesEvaluations = evaluationRepository.findAllByOrderByDateEvaluationDesc();
        stats.put("allEvaluations", toutesLesEvaluations);

        return stats;
    }

    @Transactional
    public Evaluation soumettreEvaluation(EvaluationRequestDTO dto, User clientConnecte) {
        long count = evaluationRepository.countByReservationIdAndClientId(dto.getReservationId(), clientConnecte.getId());
        if (count >= 3) {
            throw new RuntimeException("Limite de 3 évaluations atteinte pour ce voyage.");
        }

        Reservation reservation = reservationRepository.findById(dto.getReservationId())
                .orElseThrow(() -> new RuntimeException("Réservation introuvable"));

        Evaluation eval = new Evaluation();
        eval.setReservation(reservation);
        eval.setClient(clientConnecte);
        eval.setChauffeur(reservation.getTrajet().getChauffeur());
        eval.setVehicule(reservation.getTrajet().getVehicule());

        eval.setNoteGlobale(dto.getNoteGlobale());
        eval.setNoteConduite(dto.getNoteConduite());
        eval.setNoteConfort(dto.getNoteConfort());
        eval.setNotePonctualite(dto.getNotePonctualite());
        eval.setCommentaire(dto.getCommentaire());

        return evaluationRepository.save(eval);
    }

    public long getNombreEvaluations(Long reservationId, Long clientId) {
        return evaluationRepository.countByReservationIdAndClientId(reservationId, clientId);
    }


}
