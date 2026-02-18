package com.example.backend.services;

import com.example.backend.entities.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {
    // Clé secrète générée une seule fois
    private final Key key = Keys.secretKeyFor(SignatureAlgorithm.HS256);


    public String getEmailFrom(String token) {
        return Jwts.parser()
                .verifyWith((SecretKey) key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    // Génère un token JWT pour un nom d'utilisateur donné
    public String generateToken(String userEmail, User.UserRole userRole) {
        Map<String, Object> claims = new HashMap<>(); // tu peux ajouter des données supplémentaires ici
        Map<String, Object> userClaims = new HashMap<>();
        userClaims.put("email", userEmail);
        userClaims.put("role", userRole);
        claims.put("user", userClaims);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(userEmail) // tu peux supprimer cette ligne car l'email est dans les claims -> affect getEmailFrom
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 30)) // 30 minutes
                .signWith(key, SignatureAlgorithm.HS256) // HS256 compatible
                .compact();
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        final String userEmail = getEmailFrom(token);
        return (userEmail.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    public boolean isTokenExpired(String token) {
        Date expirationDate = Jwts.parser()
                .verifyWith((SecretKey) key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getExpiration();
        return expirationDate.before(new Date());
    }
}
