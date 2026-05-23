package com.example.gariconnectbackend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.util.HashMap;
import java.util.Map;

@Service
public class WhatsAppService {

    // Remplacer par vos identifiants d'API réels
    private final String INSTANCE_ID = "votre_instance_ici";
    private final String API_TOKEN = "votre_token_ici";
    private final String API_URL = "https://api.ultramsg.com/" + INSTANCE_ID + "/messages/chat";

    private final RestTemplate restTemplate = new RestTemplate();

    public void envoyerMessage(String numeroTelephone, String message) {
        if (numeroTelephone == null || numeroTelephone.isEmpty()) {
            System.err.println("⚠️ [WHATSAPP] Numéro de téléphone vide.");
            return;
        }

        try {
            String numeroNettoye = numeroTelephone.replaceAll("[^0-9]", "");

            // Conversion du format local RDC (10 chiffres commençant par 0) en format international 243
            if (numeroNettoye.length() == 10 && numeroNettoye.startsWith("0")) {
                numeroNettoye = "243" + numeroNettoye.substring(1);
            }

            Map<String, String> params = new HashMap<>();
            params.put("token", API_TOKEN);
            params.put("to", "+" + numeroNettoye);
            params.put("body", message);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, String>> request = new HttpEntity<>(params, headers);

            // Envoi HTTP réel vers l'API Gateway
            restTemplate.postForEntity(API_URL, request, String.class);
            System.out.println("🟢 [WHATSAPP REEL ENVOYÉ] à : +" + numeroNettoye);

        } catch (Exception e) {
            System.err.println("❌ Erreur lors de l'envoi de la requête WhatsApp HTTP : " + e.getMessage());
        }
    }
}