package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.model.Courrier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

@Service
public class IntelligenceArtificielleService {


    @Value("${gemini.api.key:}") // Les deux-points ":" évitent le crash si la clé est absente
    private String geminiApiKey;
    public void evaluerRisqueEtPrix(Courrier colis) {
        try {
            // 1. Préparation du Prompt (La consigne pour Gemini)
            String prompt = String.format(
                    "Tu es un expert en logistique pour une agence de transport au Congo. " +
                            "Évalue le risque et le prix de transport pour ce colis : Poids: %s Kg, Valeur: %s FC, Fragile: %b, Description: %s. " +
                            "Réponds UNIQUEMENT avec ce format exact séparé par des barres verticales (|) : " +
                            "NIVEAU_DE_RISQUE (FAIBLE, MODERE ou ELEVE) | PRIX_EN_FC | JUSTIFICATION_COURTE",
                    colis.getPoidsKg(), colis.getValeurEstimee(), colis.isEstFragile(), colis.getDescription()
            );

            // 2. Préparation de la requête HTTP pour l'API Gemini 1.5 Flash
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;

            String requestBody = "{ \"contents\": [{ \"parts\": [{\"text\": \"" + prompt + "\"}] }] }";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            // 3. Traitement de la réponse de l'IA
            // (La réponse réelle demande un parsing JSON avec ObjectMapper ou Jackson,
            // ici simplifié conceptuellement pour extraire le texte généré)
            String texteGenere = extraireTexteDeLaReponseGemini(response.getBody());

            String[] parts = texteGenere.split("\\|");

            if(parts.length >= 3) {
                colis.setNiveauRisqueIA(parts[0].trim());
                colis.setPrixSuggereIA(Double.parseDouble(parts[1].replaceAll("[^0-9.]", ""))); // Nettoie le texte pour garder que les chiffres
                colis.setJustificationIA(parts[2].trim());
            }

        } catch (Exception e) {
            System.err.println("Erreur API Gemini : " + e.getMessage());
            // Fallback (Solution de secours si pas d'internet)
            colis.setNiveauRisqueIA("MODERE");
            colis.setPrixSuggereIA(5000.0);
            colis.setJustificationIA("Évaluation IA temporairement indisponible. Prix par défaut appliqué.");
        }
    }

    // Méthode utilitaire pour parser la réponse JSON de Gemini
    private String extraireTexteDeLaReponseGemini(String jsonResponse) {
        // En vrai, utiliser un ObjectMapper (Jackson) pour lire:
        // candidates[0].content.parts[0].text
        // Exemple brut et simplifié :
        int start = jsonResponse.indexOf("\"text\": \"") + 9;
        int end = jsonResponse.indexOf("\"", start);
        return jsonResponse.substring(start, end).replace("\\n", "");
    }
}