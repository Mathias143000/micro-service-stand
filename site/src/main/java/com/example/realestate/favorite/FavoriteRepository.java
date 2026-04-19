package com.example.realestate.favorite;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
  List<Favorite> findByUserId(Long userId);
  List<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId);
  Optional<Favorite> findByUserIdAndPropertyId(Long userId, Long propertyId);
  boolean existsByUserIdAndPropertyId(Long userId, Long propertyId);
  void deleteByUserIdAndPropertyId(Long userId, Long propertyId);
}
