package com.example.realestate.marketplace;

import com.example.realestate.user.User;
import com.example.realestate.user.UserRepository;
import com.example.realestate.user.UserRole;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

@Service
public class MarketplaceAgentResolver {

  private final UserRepository userRepository;

  public MarketplaceAgentResolver(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  public User resolveAssignedRealtor() {
    return userRepository.findFirstByRoleAndEnabledTrueOrderByIdAsc(UserRole.ROLE_REALTOR)
        .or(() -> userRepository.findFirstByRoleAndEnabledTrueOrderByIdAsc(UserRole.ROLE_ADMIN))
        .orElseThrow(() -> new ResponseStatusException(SERVICE_UNAVAILABLE, "No realtor is available right now"));
  }
}
