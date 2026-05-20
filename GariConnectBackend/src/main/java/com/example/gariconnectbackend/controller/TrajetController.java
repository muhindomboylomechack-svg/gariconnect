package com.example.gariconnectbackend.controller;



import com.example.gariconnectbackend.model.Trajet;
import com.example.gariconnectbackend.service.TrajetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

        import java.util.List;

@RestController
@RequestMapping("/api/trajets")
@CrossOrigin(origins = "*")
public class TrajetController {

    @GetMapping("/recherche")
    public List<Trajet> chercherTrajets(
            @RequestParam String depart,
            @RequestParam String destination) {

        return trajetService.rechercherTrajets(depart, destination);
    }

    @Autowired
    private TrajetService trajetService;
    @PostMapping
    public Trajet ajouterTrajet(@RequestBody Trajet trajet) {
        // On remplace 'enregistrerTrajet' par 'creerTrajet'
        return trajetService.creerTrajet(trajet);
    }
   /* @PostMapping
    public Trajet ajouterTrajet(@RequestBody Trajet trajet) {
        return trajetService.enregistrerTrajet(trajet);
    }
*/
    @GetMapping
    public List<Trajet> recupererTousLesTrajets() {
        return trajetService.listerTousLesTrajets();
    }
}