/*package com.example.gariconnectbackend.model;

public enum StatutRecuperation {
    EN_ATTENTE_COTATION, // Le client a fait la demande, l'agence n'a pas encore mis de prix
    // L'agence a fixé le prix, le client doit payer
    VALIDE,              // Le supplément est payé, le chauffeur sait qu'il doit y aller
    ANNULE
}*/
package com.example.gariconnectbackend.model;

public enum StatutRecuperation {
    EN_ATTENTE_COTATION,
    EN_ATTENTE_PAIEMENT,
    PAYE,          // 👈 AJOUTE CETTE LIGNE ICI si elle manquait !
    VALIDE,        // (Si tu as utilisé VALIDE à la place de PAYE, ajuste selon ton choix)
    TERMINE
}