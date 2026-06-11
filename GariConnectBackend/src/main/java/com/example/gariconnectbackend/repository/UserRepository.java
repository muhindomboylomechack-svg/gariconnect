package com.example.gariconnectbackend.repository;

import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    List<User> findByRole(Role role);
    Long countByRole(Role role);
    boolean existsByEmail(String email);

    // Utilise le nom exact du champ : agenceEmployeur
    List<User> findByRoleAndAgenceEmployeur(Role role, User agence);
    long countByRoleAndAgenceEmployeur(Role role, User agence);

    @Query("SELECT u FROM User u WHERE u.agenceEmployeur = :agence AND u.role = :role")
    List<User> findByAgenceAndRole(@Param("agence") User agence, @Param("role") Role role);

    @Query("SELECT COUNT(u) FROM User u WHERE u.agenceEmployeur = :agence AND u.role = :role")
    long countByAgenceAndRole(@Param("agence") User agence, @Param("role") Role role);

    List<User> findByRoleAndStatut(Role role, String statut);
    Optional<User> findByEmail(String email);

    List<User> findByAgenceEmployeurAndStatut(User agence, String statut);
    Optional<User> findByNom(String nom);

    // Correction : Utilisation du nom de propriété correct 'agenceEmployeur'
    List<User> findByRoleAndAgenceEmployeur_Id(Role role, Long agenceId);

    Optional<User> findByNomIgnoreCase(String nom);
    // Permet de trouver les chauffeurs affectés à un trajet précis
    List<User> findByTrajet_IdAndRole(Long trajetId, Role role);
    // Trouve les chauffeurs d'une agence spécifique pour un trajet spécifique
    List<User> findByAgenceEmployeurAndRoleAndTrajet_Id(User agence, Role role, Long trajetId);

    Optional<User> findByTelephone(String telephone);
    // Permet à un Admin d'agence de lister TOUS les utilisateurs de son agence
    List<User> findByAgenceEmployeur(User agenceEmployeur);

    // Permet également de filtrer les utilisateurs d'une agence par un rôle spécifique si nécessaire
    List<User> findByAgenceEmployeurAndRole(User agenceEmployeur, Role role);

    List<User> findAllByAgenceEmployeurIdOrId(Long id, Long id1);



    // 🔥 NOUVEAU : Recherche stricte par l'ID de l'agence pour éviter les bugs de mapping
    List<User> findByRoleAndAgenceEmployeurId(Role role, Long agenceId);

    // 🔥 NOUVEAU : Trouver les employés de l'agence ET l'admin lui-même (grâce à son ID)
    List<User> findByAgenceEmployeurIdOrId(Long agenceEmployeurId, Long id);
}