package com.example.realestate.supportchat;

import com.example.realestate.common.BaseEntity;
import com.example.realestate.user.User;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "support_conversations", uniqueConstraints = {
    @UniqueConstraint(name = "uq_support_customer", columnNames = "customer_id")
})
public class SupportConversation extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "customer_id", nullable = false)
  private User customer;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "assigned_realtor_id")
  private User assignedRealtor;
}
