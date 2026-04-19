package com.example.realestate.analytics;

import com.example.realestate.contract.Contract;
import com.example.realestate.contract.ContractRepository;
import com.example.realestate.contract.ContractStatus;
import com.example.realestate.credit.CreditApplication;
import com.example.realestate.credit.CreditApplicationRepository;
import com.example.realestate.credit.CreditStatus;
import com.example.realestate.deal.Deal;
import com.example.realestate.deal.DealRepository;
import com.example.realestate.deal.DealStatus;
import com.example.realestate.deal.DealType;
import com.example.realestate.org.Organization;
import com.example.realestate.org.OrganizationRepository;
import com.example.realestate.payment.Payment;
import com.example.realestate.payment.PaymentRepository;
import com.example.realestate.payment.PaymentStatus;
import com.example.realestate.property.Property;
import com.example.realestate.property.PropertyRepository;
import com.example.realestate.property.PropertyStatus;
import com.example.realestate.security.StaffAccessService;
import com.example.realestate.user.User;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Slf4j
@Service
public class AnalyticsService {
  private final DealRepository dealRepository;
  private final PropertyRepository propertyRepository;
  private final ContractRepository contractRepository;
  private final CreditApplicationRepository creditApplicationRepository;
  private final PaymentRepository paymentRepository;
  private final OrganizationRepository organizationRepository;
  private final StaffAccessService staffAccessService;

  public AnalyticsService(DealRepository dealRepository,
                          PropertyRepository propertyRepository,
                          ContractRepository contractRepository,
                          CreditApplicationRepository creditApplicationRepository,
                          PaymentRepository paymentRepository,
                          OrganizationRepository organizationRepository,
                          StaffAccessService staffAccessService) {
    this.dealRepository = dealRepository;
    this.propertyRepository = propertyRepository;
    this.contractRepository = contractRepository;
    this.creditApplicationRepository = creditApplicationRepository;
    this.paymentRepository = paymentRepository;
    this.organizationRepository = organizationRepository;
    this.staffAccessService = staffAccessService;
  }

  public RealtorAnalyticsResponse getRealtorAnalytics() {
    User user = staffAccessService.requireCurrentStaffUser();
    staffAccessService.ensureAdminOrRealtor(user);

    List<Deal> deals;
    List<Property> properties;
    List<Contract> contracts;
    List<CreditApplication> credits;
    List<Payment> payments;

    if (staffAccessService.isAdmin(user)) {
      deals = dealRepository.findAll(Pageable.unpaged()).getContent();
      properties = propertyRepository.findAll();
      contracts = contractRepository.findAll(Pageable.unpaged()).getContent();
      credits = creditApplicationRepository.findAll(Pageable.unpaged()).getContent();
      payments = paymentRepository.findAll(Pageable.unpaged()).getContent();
    } else {
      Long organizationId = staffAccessService.requireOrganizationId(user);
      OrganizationScopedData data = loadOrganizationScopedData(organizationId);
      deals = data.deals();
      properties = data.properties();
      contracts = data.contracts();
      credits = data.credits();
      payments = data.payments();
    }

    long totalDeals = deals.size();
    long buyDeals = deals.stream().filter(deal -> deal.getType() == DealType.SALE).count();
    long rentDeals = deals.stream().filter(deal -> deal.getType() == DealType.RENT).count();
    long activeDeals = deals.stream().filter(deal -> deal.getStatus() == DealStatus.ACTIVE).count();
    long totalProperties = properties.size();
    long availableProperties = properties.stream().filter(property -> property.getStatus() == PropertyStatus.AVAILABLE).count();
    long totalContracts = contracts.size();
    long signedContracts = contracts.stream().filter(contract -> contract.getStatus() == ContractStatus.SIGNED).count();
    long totalCredits = credits.size();
    long issuedCredits = credits.stream().filter(credit -> credit.getStatus() == CreditStatus.ISSUED).count();
    long totalPayments = payments.size();
    long confirmedPayments = payments.stream().filter(payment -> payment.getStatus() == PaymentStatus.CONFIRMED).count();
    log.info("Analytics computed for role {}", user.getRole());
    return new RealtorAnalyticsResponse(
        totalDeals,
        buyDeals,
        rentDeals,
        activeDeals,
        totalProperties,
        availableProperties,
        totalContracts,
        signedContracts,
        totalCredits,
        issuedCredits,
        totalPayments,
        confirmedPayments
    );
  }

  public OrganizationAnalyticsDashboardResponse getOrganizationDashboard(Long requestedOrganizationId) {
    User user = staffAccessService.requireCurrentStaffUser();
    staffAccessService.ensureAdminOrRealtor(user);

    Organization organization = resolveDashboardOrganization(user, requestedOrganizationId);
    OrganizationScopedData data = loadOrganizationScopedData(organization.getId());

    long totalDeals = data.deals().size();
    long activeDeals = countActiveDeals(data.deals());
    long completedDeals = data.deals().stream().filter(deal -> deal.getStatus() == DealStatus.COMPLETED).count();
    long saleDeals = data.deals().stream().filter(deal -> deal.getType() == DealType.SALE).count();
    long rentDeals = data.deals().stream().filter(deal -> deal.getType() == DealType.RENT).count();
    long totalContracts = data.contracts().size();
    long signedContracts = data.contracts().stream().filter(contract -> contract.getStatus() == ContractStatus.SIGNED).count();
    long completedContracts = data.contracts().stream().filter(contract -> contract.getStatus() == ContractStatus.COMPLETED).count();
    long totalCredits = data.credits().size();
    long createdCredits = data.credits().stream().filter(credit -> credit.getStatus() == CreditStatus.CREATED).count();
    long issuedCredits = data.credits().stream().filter(credit -> credit.getStatus() == CreditStatus.ISSUED).count();
    long totalPayments = data.payments().size();
    long confirmedPayments = data.payments().stream().filter(payment -> payment.getStatus() == PaymentStatus.CONFIRMED).count();
    long failedPayments = data.payments().stream().filter(payment -> payment.getStatus() == PaymentStatus.FAILED).count();

    BigDecimal contractVolume = sumContractVolume(data.contracts());
    BigDecimal issuedCreditVolume = data.credits().stream()
        .filter(credit -> credit.getStatus() == CreditStatus.ISSUED)
        .map(CreditApplication::getAmount)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    BigDecimal confirmedPaymentVolume = data.payments().stream()
        .filter(payment -> payment.getStatus() == PaymentStatus.CONFIRMED)
        .map(Payment::getAmount)
        .reduce(BigDecimal.ZERO, BigDecimal::add);

    return new OrganizationAnalyticsDashboardResponse(
        organization.getId(),
        organization.getName(),
        totalDeals,
        activeDeals,
        completedDeals,
        saleDeals,
        rentDeals,
        totalContracts,
        signedContracts,
        completedContracts,
        totalCredits,
        createdCredits,
        issuedCredits,
        totalPayments,
        confirmedPayments,
        failedPayments,
        money(contractVolume),
        money(issuedCreditVolume),
        money(confirmedPaymentVolume)
    );
  }

  public String exportOrganizationDashboardCsv(Long requestedOrganizationId, AnalyticsExportPreset preset) {
    OrganizationAnalyticsDashboardResponse dashboard = getOrganizationDashboard(requestedOrganizationId);
    StringBuilder builder = new StringBuilder();
    appendRow(builder, "metric", "value");
    appendRow(builder, "preset", preset.name());
    appendRow(builder, "organization_id", dashboard.getOrganizationId());
    appendRow(builder, "organization_name", dashboard.getOrganizationName());

    switch (preset) {
      case DEAL_PIPELINE -> {
        appendRow(builder, "total_deals", dashboard.getTotalDeals());
        appendRow(builder, "active_deals", dashboard.getActiveDeals());
        appendRow(builder, "completed_deals", dashboard.getCompletedDeals());
        appendRow(builder, "sale_deals", dashboard.getSaleDeals());
        appendRow(builder, "rent_deals", dashboard.getRentDeals());
        appendRow(builder, "total_contracts", dashboard.getTotalContracts());
        appendRow(builder, "signed_contracts", dashboard.getSignedContracts());
        appendRow(builder, "completed_contracts", dashboard.getCompletedContracts());
      }
      case FINANCE_CONTROL -> {
        appendRow(builder, "total_credits", dashboard.getTotalCredits());
        appendRow(builder, "created_credits", dashboard.getCreatedCredits());
        appendRow(builder, "issued_credits", dashboard.getIssuedCredits());
        appendRow(builder, "issued_credit_volume", dashboard.getIssuedCreditVolume());
        appendRow(builder, "total_payments", dashboard.getTotalPayments());
        appendRow(builder, "confirmed_payments", dashboard.getConfirmedPayments());
        appendRow(builder, "failed_payments", dashboard.getFailedPayments());
        appendRow(builder, "confirmed_payment_volume", dashboard.getConfirmedPaymentVolume());
      }
      case EXECUTIVE_SUMMARY -> {
        appendRow(builder, "total_deals", dashboard.getTotalDeals());
        appendRow(builder, "active_deals", dashboard.getActiveDeals());
        appendRow(builder, "completed_deals", dashboard.getCompletedDeals());
        appendRow(builder, "total_contracts", dashboard.getTotalContracts());
        appendRow(builder, "signed_contracts", dashboard.getSignedContracts());
        appendRow(builder, "total_credits", dashboard.getTotalCredits());
        appendRow(builder, "issued_credits", dashboard.getIssuedCredits());
        appendRow(builder, "total_payments", dashboard.getTotalPayments());
        appendRow(builder, "confirmed_payments", dashboard.getConfirmedPayments());
        appendRow(builder, "contract_volume", dashboard.getContractVolume());
      }
    }

    return builder.toString();
  }

  private Organization resolveDashboardOrganization(User user, Long requestedOrganizationId) {
    if (staffAccessService.isAdmin(user)) {
      if (requestedOrganizationId == null || requestedOrganizationId <= 0) {
        throw new ResponseStatusException(BAD_REQUEST, "organizationId is required for admin dashboard");
      }
      return organizationRepository.findById(requestedOrganizationId)
          .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Organization not found"));
    }

    Long currentOrganizationId = staffAccessService.requireOrganizationId(user);
    if (requestedOrganizationId != null && !requestedOrganizationId.equals(currentOrganizationId)) {
      throw new ResponseStatusException(FORBIDDEN, "Access denied");
    }
    return organizationRepository.findById(currentOrganizationId)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Organization not found"));
  }

  private OrganizationScopedData loadOrganizationScopedData(Long organizationId) {
    List<Deal> deals = dealRepository.findDistinctByPropertyOrganizationIdOrBuyerOrganizationId(
        organizationId,
        organizationId,
        Pageable.unpaged()
    ).getContent();
    List<Property> properties = propertyRepository.findAll((root, query, cb) ->
        cb.equal(root.get("organization").get("id"), organizationId));
    List<Contract> contracts = contractRepository.findBySellerOrganizationIdOrBuyerOrganizationId(
        organizationId,
        organizationId,
        Pageable.unpaged()
    ).getContent();
    List<CreditApplication> credits = creditApplicationRepository.findAll(Pageable.unpaged()).getContent().stream()
        .filter(credit -> dealInvolvesOrganization(credit.getDeal(), organizationId))
        .toList();
    List<Payment> payments = paymentRepository.findAll(Pageable.unpaged()).getContent().stream()
        .filter(payment -> dealInvolvesOrganization(payment.getDeal(), organizationId))
        .toList();
    return new OrganizationScopedData(deals, properties, contracts, credits, payments);
  }

  private boolean dealInvolvesOrganization(Deal deal, Long organizationId) {
    if (deal == null) {
      return false;
    }

    Long buyerOrganizationId = deal.getBuyerOrganization() == null ? null : deal.getBuyerOrganization().getId();
    Long propertyOrganizationId = deal.getProperty() != null && deal.getProperty().getOrganization() != null
        ? deal.getProperty().getOrganization().getId()
        : null;
    return organizationId.equals(buyerOrganizationId) || organizationId.equals(propertyOrganizationId);
  }

  private long countActiveDeals(List<Deal> deals) {
    return deals.stream()
        .filter(deal -> deal.getStatus() == DealStatus.ACTIVE
            || deal.getStatus() == DealStatus.CREATED
            || deal.getStatus() == DealStatus.IN_PROGRESS
            || deal.getStatus() == DealStatus.APPROVED
            || deal.getStatus() == DealStatus.WAITING_FOR_PAYMENT)
        .count();
  }

  private BigDecimal sumContractVolume(List<Contract> contracts) {
    return contracts.stream()
        .map(Contract::getPrice)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
  }

  private BigDecimal money(BigDecimal value) {
    return value == null ? BigDecimal.ZERO : value.setScale(2, RoundingMode.HALF_UP);
  }

  private void appendRow(StringBuilder builder, String key, Object value) {
    builder.append(escapeCsv(key))
        .append(",")
        .append(escapeCsv(value == null ? "" : String.valueOf(value)))
        .append("\n");
  }

  private String escapeCsv(String value) {
    if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
      return "\"" + value.replace("\"", "\"\"") + "\"";
    }
    return value;
  }

  private record OrganizationScopedData(
      List<Deal> deals,
      List<Property> properties,
      List<Contract> contracts,
      List<CreditApplication> credits,
      List<Payment> payments
  ) {
  }
}
