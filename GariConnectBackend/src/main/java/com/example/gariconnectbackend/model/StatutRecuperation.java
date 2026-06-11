package com.example.gariconnectbackend.model;

public enum StatutRecuperation {
    EN_ATTENTE_COTATION, // Le client a fait la demande, l'agence n'a pas encore mis de prix
    EN_ATTENTE_PAIEMENT, // L'agence a fixé le prix, le client doit payer
    VALIDE,              // Le supplément est payé, le chauffeur sait qu'il doit y aller
    ANNULE
}
