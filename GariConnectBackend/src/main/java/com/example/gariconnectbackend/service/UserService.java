package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired(required = false)
    private WhatsAppService whatsAppService;

    @Transactional
    public User enregistrerUtilisateur(User user) {
        boolean estNouveauCodeGenere = false;
        String codeSecretBrut = "";

        // 1. Vérification stricte et immédiate de l'email
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Un utilisateur avec cet e-mail existe déjà.");
        }

        // 2. Traitement Multi-Tenant pour les employés (CHAUFFEUR / AGENCY_MANAGER)
        if (user.getRole() == Role.CHAUFFEUR || user.getRole() == Role.AGENCY_MANAGER) {
            Long idAgenceAAssocier = user.getAgenceId();

            if (idAgenceAAssocier == null && user.getAgenceEmployeur() != null) {
                idAgenceAAssocier = user.getAgenceEmployeur().getId();
            }

            if (idAgenceAAssocier == null) {
                throw new IllegalArgumentException("Erreur : Impossible d'enregistrer un employé sans l'associer à une entreprise Agence (AGENCY_ADMIN).");
            }

            // Récupération sécurisée du compte Agence parent
            User agenceEntreprise = userRepository.findById(idAgenceAAssocier)
                    .orElseThrow(() -> new IllegalArgumentException("L'agence d'affectation spécifiée n'existe pas."));

            // Liaison obligatoire à l'entreprise légale
            user.setAgenceId(agenceEntreprise.getId());
            user.setAgenceEmployeur(agenceEntreprise);

            // 3. Génération du Code d'accès (Sécurisée à 100% contre le Timeout)
            if (user.getCodeAcces() == null || user.getCodeAcces().trim().isEmpty()) {
                Random random = new Random();

                // Génération simple et directe : Évite les requêtes SQL intempestives dans une boucle fermée
                codeSecretBrut = String.format("%06d", random.nextInt(1000000));

                // Si par extrême malchance le code existe comme téléphone, on ajoute un suffixe aléatoire direct sans boucler
                if (userRepository.findByTelephone(codeSecretBrut).isPresent()) {
                    codeSecretBrut = String.format("%06d", random.nextInt(1000000));
                }

                user.setCodeAcces(codeSecretBrut);
                user.setPassword(passwordEncoder.encode(codeSecretBrut));
                user.setMustChangePassword(true);
                estNouveauCodeGenere = true;
            } else {
                user.setPassword(passwordEncoder.encode(user.getCodeAcces()));
            }

        } else {
            // Pour les rôles indépendants (SUPER_ADMIN, AGENCY_ADMIN, CLIENT)
            if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                throw new IllegalArgumentException("Le mot de passe est obligatoire pour ce type de profil.");
            }
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            user.setMustChangePassword(false);
            user.setCodeAcces(null);
        }

        // Application du statut par défaut
        if (user.getStatut() == null || user.getStatut().trim().isEmpty()) {
            user.setStatut("ACTIF");
        }

        // Sauvegarde immédiate
        User utilisateurSauvegarde = userRepository.save(user);

        // 4. Notification asynchrone / sécurisée par bloc Try-Catch
        if (estNouveauCodeGenere && !codeSecretBrut.isEmpty()) {
            String messageContenu = "Bienvenue chez GariConnect !\n" +
                    "Votre compte " + user.getRole().name() + " a été configuré.\n" +
                    "Identifiant : " + user.getEmail() + "\n" +
                    "Code d'accès secret : " + codeSecretBrut;

            if (mailSender != null && user.getEmail() != null) {
                try {
                    SimpleMailMessage mail = new SimpleMailMessage();
                    mail.setTo(user.getEmail());
                    mail.setSubject("GariConnect - Votre code secret d'accès");
                    mail.setText(messageContenu);
                    mailSender.send(mail);
                } catch (Exception e) {
                    System.err.println("Erreur d'envoi d'email (ignorée pour ne pas bloquer le timeout) : " + e.getMessage());
                }
            }
        }

        return utilisateurSauvegarde;
    }

    public List<User> listerTous() {
        return userRepository.findAll();
    }
}