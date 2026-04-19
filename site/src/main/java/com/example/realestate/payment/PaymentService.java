package com.example.realestate.payment;

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
public class PaymentService {
  private final PaymentRepository paymentRepository;
  private final DealRepository dealRepository;
  private final OrganizationRepository organizationRepository;
  private final StaffAccessService staffAccessService;

  public PaymentService(PaymentRepository paymentRepository,
                        DealRepository dealRepository,
                        OrganizationRepository organizationRepository,
                        StaffAccessService staffAccessService) {
    this.paymentRepository = paymentRepository;
    this.dealRepository = dealRepository;
    this.organizationRepository = organizationRepository;
    this.staffAccessService = staffAccessService;
  }

  public Page<PaymentResponse> list(Pageable pageable, Long dealId) {
    User user = currentStaff();
    Page<Payment> page;
    if (staffAccessService.isAdmin(user)) {
      page = dealId == null
          ? paymentRepository.findAll(pageable)
          : paymentRepository.findByDealId(dealId, pageable);
    } else {
      Long bankOrganizationId = staffAccessService.requireOrganizationId(user);
      page = dealId == null
          ? paymentRepository.findByBankOrganizationId(bankOrganizationId, pageable)
          : paymentRepository.findByBankOrganizationIdAndDealId(bankOrganizationId, dealId, pageable);
    }
    return page.map(this::toResponse);
  }

  public PaymentResponse get(Long id) {
    User user = currentStaff();
    Payment payment = findEntity(id);
    staffAccessService.ensureBankOrganizationAccess(user, payment.getBankOrganization());
    return toResponse(payment);
  }

  @Transactional
  public PaymentResponse create(PaymentRequest request) {
    User user = currentStaff();
    Deal deal = dealRepository.findById(request.getDealId())
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Deal not found"));
    Organization bankOrganization = resolveBankOrganization(user, request.getBankOrganizationId());

    Payment payment = new Payment();
    payment.setDeal(deal);
    payment.setBankOrganization(bankOrganization);
    payment.setAmount(request.getAmount());
    payment.setStatus(PaymentStatus.CREATED);

    Payment saved = paymentRepository.save(payment);
    log.info("Payment created: {}", saved.getId());
    return toResponse(saved);
  }

  @Transactional
  public PaymentResponse updateStatus(Long id, PaymentStatus status) {
    User user = currentStaff();
    Payment payment = findEntity(id);
    staffAccessService.ensureBankOrganizationAccess(user, payment.getBankOrganization());
    payment.setStatus(status);
    log.info("Payment status updated: {} -> {}", id, status);
    return toResponse(payment);
  }

  private User currentStaff() {
    User user = staffAccessService.requireCurrentStaffUser();
    staffAccessService.ensureAdminOrBank(user);
    return user;
  }

  private Payment findEntity(Long id) {
    return paymentRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Payment not found"));
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

  private PaymentResponse toResponse(Payment payment) {
    Deal deal = payment.getDeal();
    Organization bankOrganization = payment.getBankOrganization();
    return new PaymentResponse(
        payment.getId(),
        deal.getId(),
        deal.getProperty().getId(),
        deal.getProperty().getAddress(),
        deal.getBuyerOrganization().getId(),
        deal.getBuyerOrganization().getName(),
        bankOrganization == null ? null : bankOrganization.getId(),
        bankOrganization == null ? null : bankOrganization.getName(),
        deal.getType(),
        deal.getStatus(),
        payment.getStatus(),
        payment.getAmount(),
        payment.getPaymentDate(),
        payment.getCreatedAt(),
        payment.getUpdatedAt()
    );
  }
}
