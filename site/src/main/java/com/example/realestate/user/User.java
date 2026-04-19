package com.example.realestate.user;

import com.example.realestate.common.BaseEntity;
import com.example.realestate.org.Organization;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Convert;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "users", uniqueConstraints = {
    @UniqueConstraint(name = "uq_user_email", columnNames = "email"),
    @UniqueConstraint(name = "uq_user_username", columnNames = "username")
})
public class User extends BaseEntity {
  @Column(nullable = false)
  private String email;

  @Column
  private String username;

  @Column(nullable = false)
  private String passwordHash;

  @Column(nullable = false)
  private String fullName;

  private String phone;
  private String avatar;

  @Convert(converter = UserRoleConverter.class)
  @Column(nullable = false)
  private UserRole role;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "organization_id")
  private Organization organization;

  @Column(nullable = false)
  private boolean enabled = true;

  private String resetToken;
  private Instant resetTokenExpiresAt;
}
