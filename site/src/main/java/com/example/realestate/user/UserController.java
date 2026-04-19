package com.example.realestate.user;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
  private final UserService userService;

  public UserController(UserService userService) {
    this.userService = userService;
  }

  @GetMapping
  public Page<UserResponse> list(
      @PageableDefault Pageable pageable,
      @RequestParam(value = "role", required = false) UserRole role,
      @RequestParam(value = "enabled", required = false) Boolean enabled,
      @RequestParam(value = "query", required = false) String query,
      @RequestParam(value = "organizationId", required = false) Long organizationId
  ) {
    return userService.list(pageable, role, enabled, query, organizationId);
  }

  @GetMapping("/{id}")
  public UserResponse get(@PathVariable("id") Long id) {
    return userService.get(id);
  }

  @PutMapping("/{id}")
  public UserResponse update(@PathVariable("id") Long id, @Valid @RequestBody UserUpdateRequest request) {
    return userService.update(id, request);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
    userService.delete(id);
    return ResponseEntity.noContent().build();
  }
}
