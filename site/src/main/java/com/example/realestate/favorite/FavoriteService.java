package com.example.realestate.favorite;

import com.example.realestate.property.Property;
import com.example.realestate.property.PropertyRepository;
import com.example.realestate.user.User;
import com.example.realestate.user.UserRepository;
import com.example.realestate.user.UserRole;
import jakarta.transaction.Transactional;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.FORBIDDEN;

@Slf4j
@Service
public class FavoriteService {
  private final FavoriteRepository favoriteRepository;
  private final UserRepository userRepository;
  private final PropertyRepository propertyRepository;

  public FavoriteService(FavoriteRepository favoriteRepository,
                         UserRepository userRepository,
                         PropertyRepository propertyRepository) {
    this.favoriteRepository = favoriteRepository;
    this.userRepository = userRepository;
    this.propertyRepository = propertyRepository;
  }

  public List<Favorite> listByUser(Long userId) {
    ensureCurrentUserOrAdmin(userId);
    return favoriteRepository.findByUserId(userId);
  }

  @Transactional
  public Favorite add(Long userId, Long propertyId) {
    ensureCurrentUserOrAdmin(userId);
    if (favoriteRepository.existsByUserIdAndPropertyId(userId, propertyId)) {
      throw new ResponseStatusException(BAD_REQUEST, "Already in favorites");
    }
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
    Property property = propertyRepository.findById(propertyId)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Property not found"));

    Favorite favorite = new Favorite();
    favorite.setUser(user);
    favorite.setProperty(property);
    Favorite saved = favoriteRepository.save(favorite);
    log.info("Favorite added: user={}, property={}", userId, propertyId);
    return saved;
  }

  @Transactional
  public void remove(Long userId, Long propertyId) {
    ensureCurrentUserOrAdmin(userId);
    favoriteRepository.deleteByUserIdAndPropertyId(userId, propertyId);
    log.info("Favorite removed: user={}, property={}", userId, propertyId);
  }

  private User getCurrentUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
      throw new ResponseStatusException(FORBIDDEN, "Access denied");
    }
    return userRepository.findByEmail(authentication.getName())
        .orElseThrow(() -> new ResponseStatusException(FORBIDDEN, "Access denied"));
  }

  private boolean isAdmin(User user) {
    return user.getRole() == UserRole.ROLE_ADMIN;
  }

  private void ensureCurrentUserOrAdmin(Long userId) {
    User current = getCurrentUser();
    if (!isAdmin(current) && !current.getId().equals(userId)) {
      throw new ResponseStatusException(FORBIDDEN, "Access denied");
    }
  }
}
