package com.example.realestate.property;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PropertyPhotoRepository extends JpaRepository<PropertyPhoto, Long> {
  List<PropertyPhoto> findByPropertyId(Long propertyId);
  List<PropertyPhoto> findByPropertyIdOrderByCreatedAtAsc(Long propertyId);
  void deleteAllByPropertyId(Long propertyId);
}
