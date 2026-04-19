package com.example.realestate.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class StaffScopeAuditIntegrationTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Test
  void realtorIsScopedToOwnOrganizationAcrossDealsContractsAndProperties() throws Exception {
    String adminToken = internalLogin("admin@example.com");
    String realtorToken = internalLogin("realtor@example.com");
    long realtyOrganizationId = organizationReferenceId(adminToken, "Demo Realty");
    long counterpartyOrganizationId = createOrganization(adminToken, "Counterparty");
    long isolatedOrganizationId = createOrganization(adminToken, "Isolated");

    long ownPropertyId = createProperty(adminToken, realtyOrganizationId, "Own property");
    long isolatedPropertyId = createProperty(adminToken, isolatedOrganizationId, "Isolated property");

    long ownDealId = createDeal(adminToken, ownPropertyId, counterpartyOrganizationId);
    long isolatedDealId = createDeal(adminToken, isolatedPropertyId, counterpartyOrganizationId);

    long ownContractId = createContract(adminToken, ownPropertyId, realtyOrganizationId, counterpartyOrganizationId);
    long isolatedContractId = createContract(adminToken, isolatedPropertyId, isolatedOrganizationId, counterpartyOrganizationId);

    mockMvc.perform(get("/api/properties")
            .header(HttpHeaders.AUTHORIZATION, bearer(realtorToken)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[*].id", hasItem((int) ownPropertyId)))
        .andExpect(jsonPath("$.content[*].id", not(hasItem((int) isolatedPropertyId))));

    mockMvc.perform(get("/api/properties/{id}", isolatedPropertyId)
            .header(HttpHeaders.AUTHORIZATION, bearer(realtorToken)))
        .andExpect(status().isForbidden());

    mockMvc.perform(get("/api/deals")
            .header(HttpHeaders.AUTHORIZATION, bearer(realtorToken)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[*].id", hasItem((int) ownDealId)))
        .andExpect(jsonPath("$.content[*].id", not(hasItem((int) isolatedDealId))));

    mockMvc.perform(get("/api/deals/{id}", isolatedDealId)
            .header(HttpHeaders.AUTHORIZATION, bearer(realtorToken)))
        .andExpect(status().isForbidden());

    mockMvc.perform(get("/api/contracts")
            .header(HttpHeaders.AUTHORIZATION, bearer(realtorToken)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[*].id", hasItem((int) ownContractId)))
        .andExpect(jsonPath("$.content[*].id", not(hasItem((int) isolatedContractId))));

    mockMvc.perform(get("/api/contracts/{id}", isolatedContractId)
            .header(HttpHeaders.AUTHORIZATION, bearer(realtorToken)))
        .andExpect(status().isForbidden());
  }

  @Test
  void bankEmployeeIsScopedToOwnFinanceRecordsAndCannotAssignAnotherBankOrg() throws Exception {
    String adminToken = internalLogin("admin@example.com");
    String bankToken = internalLogin("bank@example.com");
    long realtyOrganizationId = organizationReferenceId(adminToken, "Demo Realty");
    long counterpartyOrganizationId = createOrganization(adminToken, "Buyer");
    long anotherBankOrganizationId = createOrganization(adminToken, "Another Bank");

    long ownPropertyId = createProperty(adminToken, realtyOrganizationId, "Bank visible property");
    long ownDealId = createDeal(adminToken, ownPropertyId, counterpartyOrganizationId);
    long ownCreditId = createCredit(bankToken, ownDealId, "2500000");
    long ownPaymentId = createPayment(bankToken, ownDealId, "150000");

    long otherPropertyId = createProperty(adminToken, realtyOrganizationId, "Other bank property");
    long otherDealId = createDeal(adminToken, otherPropertyId, counterpartyOrganizationId);
    long otherCreditId = createCredit(adminToken, otherDealId, "1750000", anotherBankOrganizationId);
    long otherPaymentId = createPayment(adminToken, otherDealId, "99000", anotherBankOrganizationId);

    long forbiddenPropertyId = createProperty(adminToken, realtyOrganizationId, "Forbidden property");
    long forbiddenDealId = createDeal(adminToken, forbiddenPropertyId, counterpartyOrganizationId);

    mockMvc.perform(get("/api/credits")
            .header(HttpHeaders.AUTHORIZATION, bearer(bankToken)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[*].id", hasItem((int) ownCreditId)))
        .andExpect(jsonPath("$.content[*].id", not(hasItem((int) otherCreditId))));

    mockMvc.perform(get("/api/credits/{id}", otherCreditId)
            .header(HttpHeaders.AUTHORIZATION, bearer(bankToken)))
        .andExpect(status().isForbidden());

    mockMvc.perform(get("/api/payments")
            .header(HttpHeaders.AUTHORIZATION, bearer(bankToken)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[*].id", hasItem((int) ownPaymentId)))
        .andExpect(jsonPath("$.content[*].id", not(hasItem((int) otherPaymentId))));

    mockMvc.perform(get("/api/payments/{id}", otherPaymentId)
            .header(HttpHeaders.AUTHORIZATION, bearer(bankToken)))
        .andExpect(status().isForbidden());

    mockMvc.perform(post("/api/credits/deal/{dealId}", forbiddenDealId)
            .header(HttpHeaders.AUTHORIZATION, bearer(bankToken))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "amount", "555000",
                "bankOrganizationId", anotherBankOrganizationId
            ))))
        .andExpect(status().isForbidden());

    mockMvc.perform(post("/api/payments")
            .header(HttpHeaders.AUTHORIZATION, bearer(bankToken))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "dealId", forbiddenDealId,
                "amount", "88000",
                "bankOrganizationId", anotherBankOrganizationId
            ))))
        .andExpect(status().isForbidden());
  }

  @Test
  void adminOnlyUserManagementAndResponsibilityBoundariesAreEnforced() throws Exception {
    String adminToken = internalLogin("admin@example.com");
    String realtorToken = internalLogin("realtor@example.com");
    String bankToken = internalLogin("bank@example.com");
    long realtyOrganizationId = organizationReferenceId(adminToken, "Demo Realty");

    mockMvc.perform(get("/api/users").header(HttpHeaders.AUTHORIZATION, bearer(adminToken)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[*].email", hasItem("admin@example.com")));

    mockMvc.perform(get("/api/users").header(HttpHeaders.AUTHORIZATION, bearer(realtorToken)))
        .andExpect(status().isForbidden());

    mockMvc.perform(get("/api/users").header(HttpHeaders.AUTHORIZATION, bearer(bankToken)))
        .andExpect(status().isForbidden());

    String tempEmail = "audit-" + UUID.randomUUID() + "@example.com";
    mockMvc.perform(post("/api/auth/register")
            .header(HttpHeaders.AUTHORIZATION, bearer(adminToken))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "email", tempEmail,
                "password", "Password123!",
                "fullName", "Audit User",
                "role", "ROLE_REALTOR",
                "organizationId", realtyOrganizationId
            ))))
        .andExpect(status().isOk());

    long userId = findUserIdByEmail(adminToken, tempEmail);

    mockMvc.perform(put("/api/users/{id}", userId)
            .header(HttpHeaders.AUTHORIZATION, bearer(adminToken))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "fullName", "Audit User Updated",
                "role", "ROLE_REALTOR",
                "organizationId", realtyOrganizationId,
                "enabled", true
            ))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.fullName").value("Audit User Updated"))
        .andExpect(jsonPath("$.organizationId").value(realtyOrganizationId));

    mockMvc.perform(get("/api/contracts").header(HttpHeaders.AUTHORIZATION, bearer(bankToken)))
        .andExpect(status().isForbidden());

    mockMvc.perform(get("/api/properties").header(HttpHeaders.AUTHORIZATION, bearer(bankToken)))
        .andExpect(status().isForbidden());

    mockMvc.perform(get("/api/chats/deal/1").header(HttpHeaders.AUTHORIZATION, bearer(bankToken)))
        .andExpect(status().isForbidden());

    mockMvc.perform(get("/api/credits").header(HttpHeaders.AUTHORIZATION, bearer(realtorToken)))
        .andExpect(status().isForbidden());

    mockMvc.perform(get("/api/payments").header(HttpHeaders.AUTHORIZATION, bearer(realtorToken)))
        .andExpect(status().isForbidden());
  }

  private long organizationReferenceId(String token, String name) throws Exception {
    MvcResult result = mockMvc.perform(get("/api/organizations/reference")
            .header(HttpHeaders.AUTHORIZATION, bearer(token)))
        .andExpect(status().isOk())
        .andReturn();

    JsonNode array = objectMapper.readTree(result.getResponse().getContentAsString());
    for (JsonNode item : array) {
      if (name.equals(item.path("name").asText())) {
        return item.path("id").asLong();
      }
    }
    throw new IllegalStateException("Organization not found: " + name);
  }

  private long findUserIdByEmail(String token, String email) throws Exception {
    MvcResult result = mockMvc.perform(get("/api/users")
            .param("size", "200")
            .header(HttpHeaders.AUTHORIZATION, bearer(token)))
        .andExpect(status().isOk())
        .andReturn();

    JsonNode content = objectMapper.readTree(result.getResponse().getContentAsString()).path("content");
    for (JsonNode item : content) {
      if (email.equals(item.path("email").asText())) {
        return item.path("id").asLong();
      }
    }
    throw new IllegalStateException("User not found: " + email);
  }

  private long createOrganization(String token, String prefix) throws Exception {
    String suffix = UUID.randomUUID().toString().substring(0, 8);
    String normalizedPrefix = prefix.toLowerCase().replace(" ", "");
    MvcResult result = mockMvc.perform(post("/api/organizations")
            .header(HttpHeaders.AUTHORIZATION, bearer(token))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "name", prefix + " " + suffix,
                "taxId", "TAX-" + suffix,
                "email", normalizedPrefix + suffix + "@example.com"
            ))))
        .andExpect(status().isOk())
        .andReturn();
    return readId(result);
  }

  private long createProperty(String token, long organizationId, String label) throws Exception {
    String suffix = UUID.randomUUID().toString().substring(0, 6);
    MvcResult result = mockMvc.perform(post("/api/properties")
            .header(HttpHeaders.AUTHORIZATION, bearer(token))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "organizationId", organizationId,
                "title", label,
                "type", "FOR_SALE",
                "status", "AVAILABLE",
                "address", label + " " + suffix,
                "city", "Moscow",
                "area", 82,
                "purchasePrice", 4200000,
                "published", true
            ))))
        .andExpect(status().isOk())
        .andReturn();
    return readId(result);
  }

  private long createDeal(String token, long propertyId, long buyerOrganizationId) throws Exception {
    MvcResult result = mockMvc.perform(post("/api/deals")
            .header(HttpHeaders.AUTHORIZATION, bearer(token))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "type", "SALE",
                "propertyId", propertyId,
                "buyerOrganizationId", buyerOrganizationId,
                "creditRequired", false
            ))))
        .andExpect(status().isOk())
        .andReturn();
    return readId(result);
  }

  private long createContract(String token, long propertyId, long sellerOrganizationId, long buyerOrganizationId) throws Exception {
    MvcResult result = mockMvc.perform(post("/api/contracts")
            .header(HttpHeaders.AUTHORIZATION, bearer(token))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "propertyId", propertyId,
                "sellerOrganizationId", sellerOrganizationId,
                "buyerOrganizationId", buyerOrganizationId,
                "type", "SALE",
                "price", 3900000
            ))))
        .andExpect(status().isOk())
        .andReturn();
    return readId(result);
  }

  private long createCredit(String token, long dealId, String amount) throws Exception {
    return createCredit(token, dealId, amount, null);
  }

  private long createCredit(String token, long dealId, String amount, Long bankOrganizationId) throws Exception {
    java.util.Map<String, Object> payload = new java.util.HashMap<>();
    payload.put("amount", amount);
    if (bankOrganizationId != null) {
      payload.put("bankOrganizationId", bankOrganizationId);
    }
    MvcResult result = mockMvc.perform(post("/api/credits/deal/{dealId}", dealId)
            .header(HttpHeaders.AUTHORIZATION, bearer(token))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(payload)))
        .andExpect(status().isOk())
        .andReturn();
    return readId(result);
  }

  private long createPayment(String token, long dealId, String amount) throws Exception {
    return createPayment(token, dealId, amount, null);
  }

  private long createPayment(String token, long dealId, String amount, Long bankOrganizationId) throws Exception {
    java.util.Map<String, Object> payload = new java.util.HashMap<>();
    payload.put("dealId", dealId);
    payload.put("amount", amount);
    if (bankOrganizationId != null) {
      payload.put("bankOrganizationId", bankOrganizationId);
    }
    MvcResult result = mockMvc.perform(post("/api/payments")
            .header(HttpHeaders.AUTHORIZATION, bearer(token))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(payload)))
        .andExpect(status().isOk())
        .andReturn();
    return readId(result);
  }

  private String internalLogin(String email) throws Exception {
    MvcResult result = mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "email", email,
                "password", "Password123!"
            ))))
        .andExpect(status().isOk())
        .andReturn();

    JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
    return body.path("token").asText();
  }

  private long readId(MvcResult result) throws Exception {
    JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
    return body.path("id").asLong();
  }

  private String bearer(String token) {
    return "Bearer " + token;
  }
}
