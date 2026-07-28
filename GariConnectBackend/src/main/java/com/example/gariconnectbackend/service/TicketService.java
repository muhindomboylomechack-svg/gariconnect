package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.model.Ticket;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.TicketRepository;
import com.example.gariconnectbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<Ticket> getMesTickets(String email) {
        return ticketRepository.findByReservationClientEmail(email);
    }

    @Transactional
    public void supprimerTicketClient(Long ticketId, String emailConnecte) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable."));

        User userConnecte = userRepository.findByEmail(emailConnecte)
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable."));

        // Vérification de sécurité : Seul le propriétaire ou un admin peut supprimer son ticket
        boolean isOwner = ticket.getReservation() != null &&
                ticket.getReservation().getClient() != null &&
                ticket.getReservation().getClient().getId().equals(userConnecte.getId());

        boolean isAdmin = userConnecte.getRole() == Role.SUPER_ADMIN ||
                userConnecte.getRole() == Role.AGENCY_ADMIN;

        if (!isOwner && !isAdmin) {
            throw new RuntimeException("Vous n'avez pas l'autorisation de supprimer ce ticket.");
        }

        // Suppression EXCLUSIVE de la table Ticket
        // La réservation, le paiement et les places restent 100% intacts
        ticketRepository.delete(ticket);
    }


    public List<Ticket> getTicketsPourUtilisateur(String email) {
        // Recherche les tickets liés à la réservation de ce client
        return ticketRepository.findByReservationClientEmail(email);
    }
    /**
     * Récupère tous les tickets actifs d'un utilisateur donné
     */
    @Transactional(readOnly = true)
    public List<Ticket> obtenirTicketsActifsUtilisateur(Long userId) {
        return ticketRepository.findByUserIdAndEstMasqueFalse(userId);
    }

    /**
     * Masque ou désactive un ticket (suppression logique)
     */
    @Transactional
    public void masquerTicket(Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable avec l'ID : " + ticketId));

        // 🟢 Passage du booléen estMasque à true
        ticket.setEstMasque(true);
        ticket.setStatut("MASQUE");
        ticketRepository.save(ticket);
    }

    // 🟢 Méthode pour obtenir l'historique complet d'un utilisateur
    public List<Ticket> obtenirHistoriqueUtilisateur(Long userId) {
        // Remplacer findByReservationUserId par findByReservationClientId
        return ticketRepository.findByReservationClientId(userId);
    }
    /**
     * Valide l'embarquement d'un passager lors du scan du QR code
     */
    @Transactional
    public Ticket validerEmbarquement(String codeTicket) {
        Ticket ticket = ticketRepository.findByCodeTicket(codeTicket)
                .orElseThrow(() -> new RuntimeException("Ticket invalide ou non trouvé : " + codeTicket));

        if ("EMBARQUE".equalsIgnoreCase(ticket.getStatut())) {
            throw new IllegalStateException("Ce ticket a déjà été utilisé pour l'embarquement.");
        }

        ticket.setStatut("EMBARQUE");
        return ticketRepository.save(ticket);
    }
    public void supprimerTicket(Long id) {
        if (!ticketRepository.existsById(id)) {
            throw new RuntimeException("Ticket non trouvé");
        }
        ticketRepository.deleteById(id);
    }
}