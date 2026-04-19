package com.example.romanestate.authservice.org;

import com.example.romanestate.authservice.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "organizations", uniqueConstraints = {
    @UniqueConstraint(name = "uq_org_name", columnNames = "name")
})
public class Organization extends BaseEntity {
  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private String taxId;

  private String address;
  private String phone;
  private String email;
}
