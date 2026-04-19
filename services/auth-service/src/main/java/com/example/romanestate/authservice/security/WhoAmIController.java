package com.example.romanestate.authservice.security;

import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WhoAmIController {

  @GetMapping("/api/whoami")
  public String whoami(Authentication auth) {
    if (auth == null) {
      return "auth=null";
    }

    String roles = auth.getAuthorities().stream()
        .map(a -> a.getAuthority())
        .collect(Collectors.joining(","));

    return "name=" + auth.getName() + " roles=[" + roles + "]";
  }
}
