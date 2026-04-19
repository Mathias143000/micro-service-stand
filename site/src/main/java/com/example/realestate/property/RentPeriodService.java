package com.example.realestate.property;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Slf4j
@Service
public class RentPeriodService {
  private final RentPeriodRepository rentPeriodRepository;
  private final PropertyRepository propertyRepository;

  public RentPeriodService(RentPeriodRepository rentPeriodRepository,
                           PropertyRepository propertyRepository) {
    this.rentPeriodRepository = rentPeriodRepository;
    this.propertyRepository = propertyRepository;
  }

  @Transactional
  public RentPeriod create(RentPeriodRequest request) {
    if (request.getEndDate().isBefore(request.getStartDate())) {
      throw new ResponseStatusException(BAD_REQUEST, "End date before start date");
    }
    if (rentPeriodRepository.existsOverlap(request.getPropertyId(), request.getStartDate(), request.getEndDate())) {
      throw new ResponseStatusException(BAD_REQUEST, "Rent period overlaps existing booking");
    }

    Property property = propertyRepository.findById(request.getPropertyId())
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Property not found"));

    RentPeriod period = new RentPeriod();
    period.setProperty(property);
    period.setStartDate(request.getStartDate());
    period.setEndDate(request.getEndDate());
    RentPeriod saved = rentPeriodRepository.save(period);
    log.info("Rent period created: {}", saved.getId());
    return saved;
  }
}
