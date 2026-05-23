package com.example.gariconnectbackend.service;


import com.example.gariconnectbackend.model.Role;
import com.example.gariconnectbackend.model.User;
import com.example.gariconnectbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class UserService {


    @Autowired
    private UserRepository userRepository;

    public User enregistrerUtilisateur(User user) {
        return userRepository.save(user);
    }

    public List<User> listerTous() {
        return userRepository.findAll();
    }
    public List<User> listerChauffeurs() {
        return userRepository.findByRole(Role.valueOf("CHAUFFEUR"));
    }
}