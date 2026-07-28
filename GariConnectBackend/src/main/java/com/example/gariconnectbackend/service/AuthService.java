//package com.example.gariconnectbackend.service;
//
//import com.example.gariconnectbackend.dto.AuthResponse;
//import com.example.gariconnectbackend.model.Role;
//import com.example.gariconnectbackend.model.User;
//import com.example.gariconnectbackend.repository.UserRepository;
//import com.example.gariconnectbackend.security.JwtUtil;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.stereotype.Service;
//
//@Service
//public class AuthService {
//
//    @Autowired
//    private UserRepository userRepository;
//
//    @Autowired
//    private PasswordEncoder passwordEncoder;
//
//    @Autowired
//    private JwtUtil jwtUtil;
//
//    public User inscrire(User user, Long agenceId) {
//        if (user.getRole() == Role.SUPER_ADMIN) {
//            throw new RuntimeException("Action interdite : Le compte Super Admin ne peut pas être créé via une inscription.");
//        }
//
//        // 🟢 SÉCURITÉ : Vérifier si l'email ou le téléphone existe déjà
//        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
//            throw new RuntimeException("Cet adresse email est déjà utilisée.");
//        }
//
//        // Optionnel : Décommente si tu as existsByTelephone dans ton UserRepository
//        // if (user.getTelephone() != null && userRepository.existsByTelephone(user.getTelephone())) {
//        //     throw new RuntimeException("Ce numéro de téléphone est déjà utilisé.");
//        // }
//
//        System.out.println("=== Inscription utilisateur ===");
//        System.out.println("Email reçu : " + user.getEmail());
//        System.out.println("Téléphone reçu : " + user.getTelephone());
//
//        user.setPassword(passwordEncoder.encode(user.getPassword()));
//        user.setMustChangePassword(false);
//
//        // Récupération de l'agence et création du lien relationnel
//        if (agenceId != null) {
//            User agence = userRepository.findById(agenceId)
//                    .orElseThrow(() -> new RuntimeException("L'agence sélectionnée est introuvable."));
//            user.setAgenceEmployeur(agence);
//        }
//
//        // Gestion des statuts selon le rôle
//        if (user.getRole() == Role.AGENCY_ADMIN) {
//            user.setStatut("EN_ATTENTE");
//            user.setAgenceEmployeur(null);
//        } else if (user.getRole() == Role.CHAUFFEUR || user.getRole() == Role.AGENCY_MANAGER) {
//            user.setStatut("EN_ATTENTE");
//        } else {
//            user.setStatut("ACTIF"); // Client ou passager
//        }
//
//        return userRepository.save(user);
//    }
//
//    public AuthResponse seConnecter(String email, String rawPassword) {
//        User user = userRepository.findByEmail(email)
//                .orElseThrow(() -> new RuntimeException("Identifiants ou utilisateur non trouvé"));
//
//        if ("EN_ATTENTE".equals(user.getStatut())) {
//            if (user.getRole() == Role.AGENCY_ADMIN) {
//                throw new RuntimeException("Votre compte Administrateur d'Agence est en attente de validation par GariConnect.");
//            } else if (user.getRole() == Role.CHAUFFEUR || user.getRole() == Role.AGENCY_MANAGER) {
//                throw new RuntimeException("Votre compte est en attente de validation par l'Administrateur de votre agence.");
//            }
//        }
//
//        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
//            throw new RuntimeException("Mot de passe incorrect");
//        }
//
//        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
//
//        return new AuthResponse(
//                token,
//                user.getId(),
//                user.getEmail(),
//                user.getRole().name(),
//                "Connexion réussie",
//                user.getMustChangePassword(),
//                user.getPhotoUrl()
//        );
//    }
//
//
//}
package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.dto.AuthResponse;
import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.UserRepository;
import com.example.gariconnectbackend.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * Méthode d'inscription avec la bonne gestion des statuts :
     * - CLIENT : "ACTIF" immédiatement.
     * - AGENCY_ADMIN : "EN_ATTENTE" de validation par le Super Admin.
     * - CHAUFFEUR / AGENCY_MANAGER : "EN_ATTENTE" de validation par l'Admin d'Agence.
     */
    public User inscrire(User user, Long agenceId) {
        if (user.getRole() == Role.SUPER_ADMIN) {
            throw new RuntimeException("Action interdite : Le compte Super Admin ne peut pas être créé via une inscription.");
        }

        // 🟢 SÉCURITÉ : Vérifier si l'email existe déjà
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Cette adresse email est déjà utilisée.");
        }

        System.out.println("=== Inscription utilisateur ===");
        System.out.println("Email reçu : " + user.getEmail());
        System.out.println("Téléphone reçu : " + user.getTelephone());

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setMustChangePassword(false);

        // Récupération de l'agence et création du lien relationnel
        if (agenceId != null) {
            User agence = userRepository.findById(agenceId)
                    .orElseThrow(() -> new RuntimeException("L'agence sélectionnée est introuvable."));
            user.setAgenceEmployeur(agence);
        }

        // 🟢 GESTION STRICTE DES STATUTS INITIALES SELON LE RÔLE
        if (user.getRole() == Role.AGENCY_ADMIN) {
            // Requiert la validation du Super Admin
            user.setStatut("EN_ATTENTE");
            user.setAgenceEmployeur(null);
        } else if (user.getRole() == Role.CHAUFFEUR || user.getRole() == Role.AGENCY_MANAGER) {
            // Requiert la validation de l'Admin d'Agence
            user.setStatut("EN_ATTENTE");
        } else {
            // Seul l'utilisateur CLIENT est actif immédiatement après l'inscription
            user.setStatut("ACTIF");
        }

        return userRepository.save(user);
    }



    public AuthResponse seConnecter(String email, String rawPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Identifiants ou utilisateur non trouvé"));

        // 🔑 1. VÉRIFICATION DU MOT DE PASSE EN PREMIER
        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new RuntimeException("Mot de passe incorrect");
        }

        // ⏳ 2. VÉRIFICATION DE L'ATTENTE DE VALIDATION (On garde l'exception ici car le compte n'est pas encore actif)
        if ("EN_ATTENTE".equalsIgnoreCase(user.getStatut())) {
            if (user.getRole() == Role.AGENCY_ADMIN) {
                throw new RuntimeException("Votre compte Administrateur d'Agence est en attente de validation par GariConnect (Super Admin).");
            } else if (user.getRole() == Role.CHAUFFEUR || user.getRole() == Role.AGENCY_MANAGER) {
                throw new RuntimeException("Votre compte est en attente de validation par l'Administrateur de votre agence.");
            } else {
                throw new RuntimeException("Votre compte est en attente de validation.");
            }
        }

        // 🚨 3. COMPTES BLOQUÉS : ON NE LÈVE PLUS D'EXCEPTION !
        // On laisse le processus générer un token pour que le frontend reçoive l'objet complet
        // et puisse afficher l'écran "EcranBloque" avec les coordonnées du bon admin.

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());

        // 🏢 4. RÉCUPÉRATION DES COORDONNÉES DE L'AGENCE (MULTI-TENANT)
        String telAdmin = null;
        String emailAdmin = null;
        String nomAdmin = null;

        if (user.getAgenceEmployeur() != null) {
            telAdmin = user.getAgenceEmployeur().getTelephone(); // On récupère le tel de l'AGENCY_ADMIN
            emailAdmin = user.getAgenceEmployeur().getEmail();   // On récupère l'email de l'AGENCY_ADMIN
            nomAdmin = user.getAgenceEmployeur().getNom();
        }

        return new AuthResponse(
                token,
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                "Connexion réussie",
                user.getMustChangePassword(),
                user.getPhotoUrl(),
                user.getStatut(), // Le frontend lira "BLOQUE" ou "INACTIF" ici
                telAdmin,
                emailAdmin,
                nomAdmin
        );
    }
}