package com.example.realestate.org;

public record OrganizationReferenceResponse(
    Long id,
    String name,
    String taxId,
    String address,
    String phone,
    String email
) {
}
