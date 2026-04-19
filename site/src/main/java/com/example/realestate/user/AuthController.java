package com.example.realestate.user;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @GetMapping("/me")
  public ResponseEntity<UserResponse> currentInternalUser() {
    return ResponseEntity.ok(authService.currentInternalUser());
  }

  @PostMapping("/register")
  public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
    String token = authService.register(request);
    return ResponseEntity.ok(new AuthResponse(token));
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
    String token = authService.login(request);
    return ResponseEntity.ok(new AuthResponse(token));
  }

  @PostMapping("/password/reset")
  public ResponseEntity<String> requestReset(@Valid @RequestBody PasswordResetRequest request) {
    String token = authService.requestPasswordReset(request);
    return ResponseEntity.ok(token);
  }

  @PostMapping("/password/confirm")
  public ResponseEntity<Void> confirmReset(@Valid @RequestBody PasswordResetConfirmRequest request) {
    authService.confirmPasswordReset(request);
    return ResponseEntity.ok().build();
  }
}
