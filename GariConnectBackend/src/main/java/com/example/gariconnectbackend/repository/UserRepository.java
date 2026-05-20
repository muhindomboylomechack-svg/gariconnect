package com.example.gariconnectbackend.repository;



import com.example.gariconnectbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Cette méthode est cruciale pour le login
    // Elle permet de récupérer l'utilisateur via son email
    Optional<User> findByEmail(String email);
    List<User> findByRole(String role);
}