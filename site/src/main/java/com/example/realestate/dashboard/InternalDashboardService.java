package com.example.realestate.dashboard;

import com.example.realestate.credit.CreditApplicationRepository;
import com.example.realestate.credit.CreditStatus;
import com.example.realestate.marketplace.MarketplaceDealRepository;
import com.example.realestate.marketplace.MarketplaceDealStatus;
import com.example.realestate.security.StaffAccessService;
import com.example.realestate.supportchat.SupportConversationRepository;
import com.example.realestate.user.User;
import java.util.EnumSet;
import java.util.Set;
import org.springframework.stereotype.Service;

@Service
public class InternalDashboardService {
  private static final Set<MarketplaceDealStatus> OPEN_LEAD_STATUSES = EnumSet.of(
      MarketplaceDealStatus.REQUESTED,
      MarketplaceDealStatus.IN_REVIEW,
      MarketplaceDealStatus.VIEWING,
      MarketplaceDealStatus.NEGOTIATION
  );

  private final MarketplaceDealRepository marketplaceDealRepository;
  private final SupportConversationRepository supportConversationRepository;
  private final CreditApplicationRepository creditApplicationRepository;
  private final StaffAccessService staffAccessService;

  public InternalDashboardService(MarketplaceDealRepository marketplaceDealRepository,
                                  SupportConversationRepository supportConversationRepository,
                                  CreditApplicationRepository creditApplicationRepository,
                                  StaffAccessService staffAccessService) {
    this.marketplaceDealRepository = marketplaceDealRepository;
    this.supportConversationRepository = supportConversationRepository;
    this.creditApplicationRepository = creditApplicationRepository;
    this.staffAccessService = staffAccessService;
  }

  public InternalNavCountersResponse getNavCounters() {
    User currentUser = staffAccessService.requireCurrentStaffUser();
    long openLeadCount = 0;
    long supportConversationCount = 0;
    long pendingCreditCount = 0;

    if (staffAccessService.isAdmin(currentUser)) {
      openLeadCount = marketplaceDealRepository.countByStatusIn(OPEN_LEAD_STATUSES);
      supportConversationCount = supportConversationRepository.count();
      pendingCreditCount = creditApplicationRepository.countByStatus(CreditStatus.CREATED);
    } else if (staffAccessService.isRealtor(currentUser)) {
      openLeadCount = marketplaceDealRepository.countByAssignedRealtorIdAndStatusIn(currentUser.getId(), OPEN_LEAD_STATUSES);
      supportConversationCount = supportConversationRepository.countByAssignedRealtorId(currentUser.getId());
    } else if (staffAccessService.isBankEmployee(currentUser)) {
      Long organizationId = staffAccessService.requireOrganizationId(currentUser);
      pendingCreditCount =
          creditApplicationRepository.countByBankOrganizationIdAndStatus(organizationId, CreditStatus.CREATED)
              + creditApplicationRepository.countByBankOrganizationIsNullAndStatus(CreditStatus.CREATED);
    }

    return new InternalNavCountersResponse(openLeadCount, supportConversationCount, pendingCreditCount);
  }
}
