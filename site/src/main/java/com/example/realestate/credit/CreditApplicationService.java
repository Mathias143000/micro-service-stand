package com.example.realestate.credit;

import com.example.realestate.deal.Deal;
import com.example.realestate.deal.DealRepository;
import com.example.realestate.org.Organization;
import com.example.realestate.org.OrganizationRepository;
import com.example.realestate.security.StaffAccessService;
import com.example.realestate.user.User;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Slf4j
@Service
public class CreditApplicationService {
  private final CreditApplicationRepository creditApplicationRepository;
  private final DealRepository dealRepository;
  private final OrganizationRepository organizationRepository;
  private final StaffAccessService staffAccessService;

  public CreditApplicationService(CreditApplicationRepository creditApplicationRepository,
                                  DealRepository dealRepository,
                                  OrganizationRepository organizationRepository,
                                  StaffAccessService staffAccessService) {
    this.creditApplicationRepository = creditApplicationRepository;
    this.dealRepository = dealRepository;
    this.organizationRepository = organizationRepository;
    this.staffAccessService = staffAccessService;
  }

  public Page<CreditApplicationResponse> list(Pageable pageable, Long dealId) {
    User user = currentStaff();
    Page<CreditApplication> page;
    if (staffAccessService.isAdmin(user)) {
      page = dealId == null
          ? creditApplicationRepository.findAll(pageable)
          : creditApplicationRepository.findByDealId(dealId, pageable);
    } else {
      Long bankOrganizationId = staffAccessService.requireOrganizationId(user);
      page = dealId == null
          ? creditApplicationRepository.findByBankOrganizationIdOrBankOrganizationIsNull(bankOrganizationId, pageable)
          : creditApplicationRepository.findByDealIdAndBankOrganizationIdOrDealIdAndBankOrganizationIsNull(
              dealId,
              bankOrganizationId,
              dealId,
              pageable
          );
    }
    return page.map(this::toResponse);
  }

  public CreditApplicationResponse get(Long id) {
    User user = currentStaff();
    CreditApplication application = findEntity(id);
    ensureReadableByCurrentBank(user, application);
    return toResponse(application);
  }

  @Transactional
  public CreditApplicationResponse createForDeal(Long dealId, CreditApplicationRequest request) {
    User user = currentStaff();
    if (creditApplicationRepository.existsByDealId(dealId)) {
      throw new ResponseStatusException(BAD_REQUEST, "Credit application already exists for deal");
    }

    Deal deal = dealRepository.findById(dealId)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Deal not found"));
    Organization bankOrganization = resolveBankOrganization(user, request.getBankOrganizationId());

    CreditApplication application = new CreditApplication();
    application.setDeal(deal);
    application.setBankOrganization(bankOrganization);
    application.setAmount(request.getAmount());
    application.setStatus(CreditStatus.CREATED);

    CreditApplication saved = creditApplicationRepository.save(application);
    deal.setCreditApplication(saved);
    log.info("Credit application created: {}", saved.getId());
    return toResponse(saved);
  }

  @Transactional
  public CreditApplicationResponse updateStatus(Long id, CreditStatus status, String comment) {
    User user = currentStaff();
    CreditApplication application = findEntity(id);
    assignCurrentBankIfNeeded(user, application);
    staffAccessService.ensureBankOrganizationAccess(user, application.getBankOrganization());
    application.setStatus(status);
    application.setBankComment(comment);
    log.info("Credit status updated: {} -> {}", id, status);
    return toResponse(application);
  }

  private User currentStaff() {
    User user = staffAccessService.requireCurrentStaffUser();
    staffAccessService.ensureAdminOrBank(user);
    return user;
  }

  private CreditApplication findEntity(Long id) {
    return creditApplicationRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Credit application not found"));
  }

  private Organization resolveBankOrganization(User user, Long requestedBankOrganizationId) {
    if (staffAccessService.isAdmin(user)) {
      if (requestedBankOrganizationId == null || requestedBankOrganizationId <= 0) {
        throw new ResponseStatusException(BAD_REQUEST, "Bank organization is required");
      }
      return organizationRepository.findById(requestedBankOrganizationId)
          .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Organization not found"));
    }

    Long currentOrganizationId = staffAccessService.requireOrganizationId(user);
    Long effectiveOrganizationId = requestedBankOrganizationId == null ? currentOrganizationId : requestedBankOrganizationId;
    Organization bankOrganization = organizationRepository.findById(effectiveOrganizationId)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Organization not found"));
    staffAccessService.ensureBankOrganizationAccess(user, bankOrganization);
    return bankOrganization;
  }

  private void ensureReadableByCurrentBank(User user, CreditApplication application) {
    if (!staffAccessService.isAdmin(user) && application.getBankOrganization() == null) {
      return;
    }

    staffAccessService.ensureBankOrganizationAccess(user, application.getBankOrganization());
  }

  private void assignCurrentBankIfNeeded(User user, CreditApplication application) {
    if (staffAccessService.isAdmin(user) || application.getBankOrganization() != null) {
      return;
    }

    Long bankOrganizationId = staffAccessService.requireOrganizationId(user);
    Organization bankOrganization = organizationRepository.findById(bankOrganizationId)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Organization not found"));
    application.setBankOrganization(bankOrganization);
  }

  private CreditApplicationResponse toResponse(CreditApplication application) {
    Deal deal = application.getDeal();
    Organization bankOrganization = application.getBankOrganization();
    return new CreditApplicationResponse(
        application.getId(),
        deal.getId(),
        deal.getProperty().getId(),
        deal.getProperty().getAddress(),
        deal.getBuyerOrganization().getId(),
        deal.getBuyerOrganization().getName(),
        bankOrganization == null ? null : bankOrganization.getId(),
        bankOrganization == null ? null : bankOrganization.getName(),
        deal.getType(),
        deal.getStatus(),
        application.getStatus(),
        application.getAmount(),
        application.getBankComment(),
        application.getCreatedAt(),
        application.getUpdatedAt()
    );
  }
}
