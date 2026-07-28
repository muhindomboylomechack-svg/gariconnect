package com.example.gariconnectbackend.repository;
import com.example.gariconnectbackend.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    // Spring Data JPA comprend cette méthode grâce au nommage automatique :
    // "Trouve les tickets par userId ET dont estMasque est égal à False"
    List<Ticket> findByUserIdAndEstMasqueFalse(Long userId);


    List<Ticket> findByReservationClientEmail(String email);
           List<Ticket> findByReservationClientIdAndStatutNot(Long clientId, String statut);

    // Recherche par code ticket (utilisé pour l'embarquement)
    Optional<Ticket> findByCodeTicket(String codeTicket);

    List<Ticket> findByReservationClientId(Long clientId);
}