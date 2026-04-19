package com.example.romanestate.authservice.security;

import com.example.romanestate.authservice.user.User;
import com.example.romanestate.authservice.user.UserRepository;
import java.util.List;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

  private final UserRepository userRepository;

  public CustomUserDetailsService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @Override
  public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
    User user = userRepository.findByEmailOrUsername(identifier, identifier)
        .orElseThrow(() -> new UsernameNotFoundException("User not found: " + identifier));

    return new org.springframework.security.core.userdetails.User(
        user.getEmail(),
        user.getPasswordHash(),
        user.isEnabled(),
        true,
        true,
        true,
        List.of(new SimpleGrantedAuthority(user.getRole().name()))
    );
  }
}
