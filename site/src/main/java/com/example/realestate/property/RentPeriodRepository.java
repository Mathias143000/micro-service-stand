package com.example.realestate.property;

import java.time.LocalDate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RentPeriodRepository extends JpaRepository<RentPeriod, Long> {
  @Query("select count(r) > 0 from RentPeriod r where r.property.id = :propertyId and r.startDate <= :endDate and r.endDate >= :startDate")
  boolean existsOverlap(@Param("propertyId") Long propertyId,
                        @Param("startDate") LocalDate startDate,
                        @Param("endDate") LocalDate endDate);
}
