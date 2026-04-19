package com.example.realestate.favorite;

import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {
  private final FavoriteService favoriteService;

  public FavoriteController(FavoriteService favoriteService) {
    this.favoriteService = favoriteService;
  }

  @GetMapping("/user/{userId}")
  public List<Favorite> listByUser(@PathVariable("userId") Long userId) {
    return favoriteService.listByUser(userId);
  }

  @PostMapping("/user/{userId}/property/{propertyId}")
  public Favorite add(@PathVariable("userId") Long userId, @PathVariable("propertyId") Long propertyId) {
    return favoriteService.add(userId, propertyId);
  }

  @DeleteMapping("/user/{userId}/property/{propertyId}")
  public ResponseEntity<Void> remove(@PathVariable("userId") Long userId, @PathVariable("propertyId") Long propertyId) {
    favoriteService.remove(userId, propertyId);
    return ResponseEntity.noContent().build();
  }
}
