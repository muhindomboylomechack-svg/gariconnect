package com.example.gariconnectbackend.repository;
import com.example.gariconnectbackend.model.DemandeRecuperation;
import com.example.gariconnectbackend.model.StatutRecuperation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DemandeRecuperationRepository extends JpaRepository<DemandeRecuperation, Long> {

    // Trouver toutes les demandes d'un client spécifique (pour son historique)
    List<DemandeRecuperation> findByClientId(Long clientId);

//    // Trouver la demande associée à un billet/réservation précis
  Optional<DemandeRecuperation> findByReservationId(Long reservationId);

    // Lister toutes les demandes ayant un statut précis (Utile pour l'agent de guichet : EN_ATTENTE_COTATION)
    List<DemandeRecuperation> findByStatut(StatutRecuperation statut);
    // Le mot-clé "First" demande à la base de données de s'arrêter dès qu'elle trouve une demande.
    Optional<DemandeRecuperation> findFirstByReservationId(Long reservationId);
    // Lister les demandes d'un client filtrées par statut
    List<DemandeRecuperation> findByClientIdAndStatut(Long clientId, StatutRecuperation statut);
    List<DemandeRecuperation> findByReservationIdInAndStatut(List<Long> reservationIds, StatutRecuperation statut);

    // Tu peux aussi ajouter une méthode pour récupérer plusieurs statuts :
    List<DemandeRecuperation> findByStatutIn(List<StatutRecuperation> statuts);
}