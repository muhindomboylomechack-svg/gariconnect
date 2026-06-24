package com.example.gariconnectbackend.controller;

import com.example.gariconnectbackend.model.*;
        import com.example.gariconnectbackend.repository.*;
        import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

        import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chauffeur/courses")
@CrossOrigin("*")
@PreAuthorize("hasRole('CHAUFFEUR')")
public class CourseChauffeurController {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReservationRepository reservationRepository;


    // 🚌 1. OBTENIR LA COURSE EN COURS DU CHAUFFEUR
    @GetMapping("/active")
    public ResponseEntity<?> getCourseActive() {
        try {
            User chauffeur = getAuthenticatedChauffeur();
            Course course = courseRepository.findByChauffeurIdAndStatut(chauffeur.getId(), StatutCourse.EN_COURS)
                    .orElseThrow(() -> new RuntimeException("Vous n'avez aucune course active pour le moment."));

            return ResponseEntity.ok(course);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // 🚌 2. LISTER LES PASSAGERS D'UN ARRÊT ASSIGNÉS À CETTE COURSE
    @GetMapping("/{courseId}/arrets/{arretId}/passagers")
    public ResponseEntity<?> getPassagersAArret(@PathVariable Long courseId, @PathVariable Long arretId) {
        try {
            // On récupère toutes les réservations liées à cette course et qui attendent à cet arrêt précis
            List<Reservation> passagers = reservationRepository.findByCourseAssigneeIdAndArretMontageId(courseId, arretId);
            return ResponseEntity.ok(passagers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur récupération passagers : " + e.getMessage()));
        }
    }



    // 🚌 4. MARQUER UN PASSAGER COMME ABSENT SI LE BUS EST PASSÉ ET QU'IL N'ÉTAIT PAS LÀ
    @PutMapping("/reservations/{reservationId}/absent")
    @Transactional
    public ResponseEntity<?> marquerPassagerAbsent(@PathVariable Long reservationId) {
        try {
            Reservation reservation = reservationRepository.findById(reservationId)
                    .orElseThrow(() -> new RuntimeException("Billet/Réservation introuvable"));

            reservation.setStatutEmbarquement(StatutPassagerArret.ABSENT);
            reservationRepository.save(reservation);

            return ResponseEntity.ok(Map.of("message", "Le passager a été marqué absent."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
    private User getAuthenticatedChauffeur() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Chauffeur non trouvé ou session expirée."));
    }

    // 🚌 1. MON ITINÉRAIRE
    // Correspond à : GET /api/courses/mon-itineraire
    @GetMapping("/api/courses/mon-itineraire")
    @PreAuthorize("hasRole('CHAUFFEUR')")
    public ResponseEntity<?> getMonItineraire() {
        try {
            User chauffeur = getAuthenticatedChauffeur();
            Course course = courseRepository.findByChauffeurIdAndStatut(chauffeur.getId(), StatutCourse.EN_COURS)
                    .orElseThrow(() -> new RuntimeException("Vous n'avez aucune course active pour le moment."));

            // On renvoie la course avec la liste de ses arrêts (le trajet)
            return ResponseEntity.ok(course);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // 🚌 2. LISTER LES PASSAGERS D'UN ARRÊT
    // Correspond à : GET /api/courses/arrets/{arretId}/passagers
    @GetMapping("/api/courses/arrets/{arretId}/passagers")
    @PreAuthorize("hasRole('CHAUFFEUR')")
    public ResponseEntity<?> getPassagersAArret(@PathVariable Long arretId) {
        try {
            User chauffeur = getAuthenticatedChauffeur();
            Course courseActive = courseRepository.findByChauffeurIdAndStatut(chauffeur.getId(), StatutCourse.EN_COURS)
                    .orElseThrow(() -> new RuntimeException("Aucune course active."));

            List<Reservation> passagers = reservationRepository.findByCourseAssigneeIdAndArretMontageId(
                    courseActive.getId(),
                    arretId
            );
            return ResponseEntity.ok(passagers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Erreur récupération passagers : " + e.getMessage()));
        }
    }

    // 🚌 3. EMBARQUER UN CLIENT
    // Correspond à : PUT /api/reservations/{id}/embarquer
    @PutMapping("/api/reservations/{id}/embarquer")
    @PreAuthorize("hasRole('CHAUFFEUR')")
    @Transactional
    public ResponseEntity<?> embarquerPassager(@PathVariable Long id) {
        try {
            Reservation reservation = reservationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Billet/Réservation introuvable"));

            // Le statut passe de EN_ATTENTE_A_L_ARRET à A_BORD
            reservation.setStatutEmbarquement(StatutPassagerArret.A_BORD);
            reservationRepository.save(reservation);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Passager embarqué avec succès. La place à l'arrêt est libérée !"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
