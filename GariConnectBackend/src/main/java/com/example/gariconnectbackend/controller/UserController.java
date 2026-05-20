package com.example.gariconnectbackend.controller;



import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

        import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping
    public User creerCompte(@RequestBody User user) {
        return userService.enregistrerUtilisateur(user);
    }

    @GetMapping
    public List<User> recupererTousLesUtilisateurs() {
        return userService.listerTous();
    }
}