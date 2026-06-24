package com.example.gariconnectbackend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AiIntegrationService {

    @Value("${gariconnect.ai.api-key}")
    private String aiApiKey;

    public void appelerIA() {
        // Vous pouvez maintenant utiliser 'aiApiKey' pour vos requêtes HTTP vers l'API
        System.out.println("Clé IA chargée avec succès.");
    }
}