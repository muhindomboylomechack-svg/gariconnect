package com.example.gariconnectbackend.service;

import com.example.gariconnectbackend.model.Courrier;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

@Service
public class IntelligenceArtificielleService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Taux du jour indicatif (Ajustable ou connectable à une API de taux si nécessaire)
    private static final double TAUX_DU_JOUR = 2800.0;

    public void evaluerRisqueEtPrix(Courrier colis) {
        try {
            // 1. Préparation du Prompt Multidevise avec Demande de Justifications et Raisons Établies
            String prompt = String.format(
                    "Tu es un expert en tarification et logistique routière pour GariConnect en République Démocratique du Congo (RDC).\n" +
                            "Évalue de manière critique le risque de transport et suggère un prix de taxation optimal pour ce colis :\n" +
                            "- Description : %s\n" +
                            "- Poids : %s Kg\n" +
                            "- Valeur déclarée : %s (Évalue si c'est en Francs Congolais ou Dollars Américains selon le montant)\n" +
                            "- Est fragile ? : %b\n\n" +
                            "Instructions impératives :\n" +
                            "1. Détermine le niveau de risque parmi : FAIBLE, MODERE, ELEVE.\n" +
                            "2. Suggère un prix de taxation réaliste et optimal en Dollars Américains (USD).\n" +
                            "3. Donne également son équivalent exact en Francs Congolais (FC) en appliquant strictement le taux du jour actuel qui est de 1 USD = %.0f FC.\n" +
                            "4. Rédige une justification détaillée en donnant explicitement les RAISONS qui soutiennent ton analyse (ex: corrélation entre le poids et l'usure du véhicule, risques liés à la fragilité sur les routes en province, valeur marchande nécessitant une assurance ou des mesures de sécurité contre le vol).\n\n" +
                            "Format de réponse exigé (Réponds UNIQUEMENT sous cette forme, sur une seule ligne continue, les 4 éléments séparés strictement par des barres verticales) :\n" +
                            "NIVEAU_DE_RISQUE | PRIX_EN_USD | PRIX_EN_FC | JUSTIFICATION_ET_RAISONS_LOGISTIQUES",
                    colis.getDescription(), colis.getPoidsKg(), colis.getValeurEstimee(), colis.isEstFragile(), TAUX_DU_JOUR
            );

            // 2. Préparation et envoi de la requête HTTP vers l'API Gemini 1.5 Flash
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;

            String jsonPrompt = prompt.replace("\\", "\\\\").replace("\"", "\\\"");
            String requestBody = "{ \"contents\": [{ \"parts\": [{\"text\": \"" + jsonPrompt + "\"}] }] }";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            // 3. Extraction et parsing JSON sécurisé
            String texteGenere = extraireTexteDeLaReponseGemini(response.getBody());

            if (texteGenere != null && texteGenere.contains("|")) {
                String[] parts = texteGenere.split("\\|");

                if (parts.length >= 4) {
                    // Composant 1 : Risque
                    colis.setNiveauRisqueIA(parts[0].trim().toUpperCase());

                    // Composant 2 & 3 : Prix en USD et son équivalent en FC
                    String usdNettoye = parts[1].replaceAll("[^0-9.]", "").trim();
                    String fcNettoye = parts[2].replaceAll("[^0-9.]", "").trim();

                    double prixUSD = Double.parseDouble(usdNettoye);
                    double prixFC = Double.parseDouble(fcNettoye);

                    // Par défaut, on stocke la valeur en FC dans le champ prixSuggereIA (ou selon ta préférence de devise pivot)
                    colis.setPrixSuggereIA(prixFC);

                    // Composant 4 : Raisons qui soutiennent l'analyse logistique
                    String raisonsLogistiques = parts[3].trim();

                    // On encapsule la double tarification clairement au début de la justification pour l'affichage Frontend
                    String justificationComplete = String.format(
                            "[Tarification : %.2f USD / Equiv: %.0f FC au taux de %.0f] - Raisons de l'analyse : %s",
                            prixUSD, prixFC, TAUX_DU_JOUR, raisonsLogistiques
                    );

                    colis.setJustificationIA(justificationComplete);
                }
            }

        } catch (Exception e) {
            System.err.println("❌ Erreur API Gemini : " + e.getMessage());
            // Fallback de sécurité (Hors-ligne / Quota dépassé)
            colis.setNiveauRisqueIA("MODERE");
            double fallbackUSD = 3.0;
            double fallbackFC = fallbackUSD * TAUX_DU_JOUR;
            colis.setPrixSuggereIA(fallbackFC);
            colis.setJustificationIA(String.format(
                    "[Tarification Secours : %.2f USD / %.0f FC] - Service d'analyse indisponible. Motifs : Problème d'accès à l'API Gemini.",
                    fallbackUSD, fallbackFC
            ));
        }
    }

    private String extraireTexteDeLaReponseGemini(String jsonResponse) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(jsonResponse);

            // Navigation sécurisée dans l'arbre JSON de Gemini 1.5
            JsonNode textNode = root.path("candidates")
                    .path(0)
                    .path("content")
                    .path("parts")
                    .path(0)
                    .path("text");

            if (!textNode.isMissingNode()) {
                return textNode.asText();
            }
        } catch (Exception e) {
            System.err.println("Erreur lors du parsing JSON : " + e.getMessage());
        }
        return "";
    }
}