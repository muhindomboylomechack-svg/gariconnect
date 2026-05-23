package com.example.gariconnectbackend.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        String rawPassword = "123456"; // Le mot de passe que tu veux utiliser
        String encodedPassword = encoder.encode(rawPassword);

        System.out.println("--- GÉNÉRATEUR DE MOT DE PASSE ---");
        System.out.println("Mot de passe clair : " + rawPassword);
        System.out.println("Valeur à copier en BDD : " + encodedPassword);
    }
}
