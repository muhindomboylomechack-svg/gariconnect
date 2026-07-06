package com.example.gariconnectbackend.repository;

import com.example.gariconnectbackend.model.Courrier;
import com.example.gariconnectbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional; // 🔍 Ajouté pour gérer proprement le résultat de recherche

@Repository
public interface CourrierRepository extends JpaRepository<Courrier, Long> {

    List<Courrier> findByTelDestinataire(String tel);
    List<Courrier> findByAgence_Id(Long agenceId);
    List<Courrier> findByTelExpediteur(String telExpediteur);

    @Query("SELECT c FROM Courrier c WHERE c.agence = :agence ORDER BY c.id DESC")
    List<Courrier> findByAgenceOrigineOrderByIdDesc(@Param("agence") User agence);

    List<Courrier> findByAgenceAndType(User agence, String type);
    List<Courrier> findByAgenceAndStatut(User agence, String statut);

    /**
     * 🚀 Récupérer tous les colis liés à un utilisateur (Expéditeur OU Destinataire)
     * Recherche par objet de compte OU par son numéro de téléphone officiel
     */
    @Query("SELECT c FROM Courrier c WHERE " +
            "c.expediteurCompte = :user OR c.destinataireCompte = :user OR " +
            "c.telExpediteur = :telephone OR c.telDestinataire = :telephone " +
            "ORDER BY c.dateEnvoi DESC")
    List<Courrier> findAllByClientCompteOrTelephone(@Param("user") User user, @Param("telephone") String telephone);

    /**
     * 🔍 Correction Optimale : Remplacement du type interne protégé par un Optional standard de JPA
     */
    Optional<Courrier> findByCodeRetrait(String code);

    List<Courrier> findByTrajet_Agence_Id(Long id);

}