package com.example.realestate.internal;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.LinkedHashMap;
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

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class InternalFinanceWorkflowIntegrationTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Test
  void bankAndAdminCanManageCreditsPaymentsAndAnalytics() throws Exception {
    String adminToken = internalLogin("admin@example.com");
    String bankToken = internalLogin("bank@example.com");
    String realtorToken = internalLogin("realtor@example.com");

    long sellerOrganizationId = createOrganization(adminToken, "Seller");
    long buyerOrganizationId = createOrganization(adminToken, "Buyer");
    long propertyId = createProperty(adminToken, sellerOrganizationId);
    long dealId = createDeal(adminToken, propertyId, buyerOrganizationId);

    long creditId = createCredit(bankToken, dealId, "2500000");
    long paymentId = createPayment(bankToken, dealId, "125000");

    mockMvc.perform(get("/api/credits")
            .header(HttpHeaders.AUTHORIZATION, bearer(bankToken)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[*].id", hasItem((int) creditId)))
        .andExpect(jsonPath("$.content[*].dealId", hasItem((int) dealId)));

    mockMvc.perform(get("/api/payments")
            .header(HttpHeaders.AUTHORIZATION, bearer(bankToken)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[*].id", hasItem((int) paymentId)))
        .andExpect(jsonPath("$.content[*].dealId", hasItem((int) dealId)));

    mockMvc.perform(put("/api/credits/{id}/status", creditId)
            .header(HttpHeaders.AUTHORIZATION, bearer(bankToken))
            .param("status", "APPROVED")
            .param("comment", "Documents verified"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("APPROVED"))
        .andExpect(jsonPath("$.bankComment").value("Documents verified"));

    mockMvc.perform(put("/api/payments/{id}/status", paymentId)
            .header(HttpHeaders.AUTHORIZATION, bearer(bankToken))
            .param("status", "CONFIRMED"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("CONFIRMED"));

    mockMvc.perform(get("/api/analytics/realtor")
            .header(HttpHeaders.AUTHORIZATION, bearer(adminToken)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.totalDeals").value(greaterThanOrEqualTo(1)))
        .andExpect(jsonPath("$.totalProperties").value(greaterThanOrEqualTo(1)))
        .andExpect(jsonPath("$.totalCredits").value(greaterThanOrEqualTo(1)))
        .andExpect(jsonPath("$.totalPayments").value(greaterThanOrEqualTo(1)));

    mockMvc.perform(get("/api/credits")
            .header(HttpHeaders.AUTHORIZATION, bearer(realtorToken)))
        .andExpect(status().isForbidden());

    mockMvc.perform(get("/api/analytics/realtor")
            .header(HttpHeaders.AUTHORIZATION, bearer(bankToken)))
        .andExpect(status().isForbidden());
  }

  @Test
  void bankCanSeeAndClaimUnassignedCreditApplicationsCreatedFromDealFlow() throws Exception {
    String adminToken = internalLogin("admin@example.com");
    String bankToken = internalLogin("bank@example.com");

    long sellerOrganizationId = createOrganization(adminToken, "Seller Queue");
    long buyerOrganizationId = createOrganization(adminToken, "Buyer Queue");
    long propertyId = createProperty(adminToken, sellerOrganizationId);
    long dealId = createDeal(adminToken, propertyId, buyerOrganizationId, true);

    MvcResult listResult = mockMvc.perform(get("/api/credits")
            .header(HttpHeaders.AUTHORIZATION, bearer(bankToken)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[*].dealId", hasItem((int) dealId)))
        .andReturn();

    JsonNode listBody = objectMapper.readTree(listResult.getResponse().getContentAsString());
    long creditId = listBody.path("content").get(0).path("id").asLong();

    mockMvc.perform(put("/api/credits/{id}/status", creditId)
            .header(HttpHeaders.AUTHORIZATION, bearer(bankToken))
            .param("status", "APPROVED")
            .param("comment", "Claimed from bank queue"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("APPROVED"))
        .andExpect(jsonPath("$.bankOrganizationName").value("Demo Bank"))
        .andExpect(jsonPath("$.bankComment").value("Claimed from bank queue"));
  }

  private long createOrganization(String token, String label) throws Exception {
    String suffix = UUID.randomUUID().toString().substring(0, 8);
    String emailPrefix = label.toLowerCase().replaceAll("[^a-z0-9]+", "");
    MvcResult result = mockMvc.perform(post("/api/organizations")
            .header(HttpHeaders.AUTHORIZATION, bearer(token))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "name", label + " Org " + suffix,
                "taxId", "TAX-" + suffix,
                "email", emailPrefix + suffix + "@example.com"
            ))))
        .andExpect(status().isOk())
        .andReturn();

    return readId(result);
  }

  private long createProperty(String token, long organizationId) throws Exception {
    String suffix = UUID.randomUUID().toString().substring(0, 6);
    MvcResult result = mockMvc.perform(post("/api/properties")
            .header(HttpHeaders.AUTHORIZATION, bearer(token))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "organizationId", organizationId,
                "type", "FOR_SALE",
                "status", "AVAILABLE",
                "address", "Finance test " + suffix,
                "area", 76,
                "purchasePrice", 4200000
            ))))
        .andExpect(status().isOk())
        .andReturn();

    return readId(result);
  }

  private long createDeal(String token, long propertyId, long buyerOrganizationId) throws Exception {
    return createDeal(token, propertyId, buyerOrganizationId, false);
  }

  private long createDeal(String token, long propertyId, long buyerOrganizationId, boolean creditRequired) throws Exception {
    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("type", "SALE");
    payload.put("propertyId", propertyId);
    payload.put("buyerOrganizationId", buyerOrganizationId);
    payload.put("creditRequired", creditRequired);
    if (creditRequired) {
      payload.put("creditAmount", 1800000);
    }

    MvcResult result = mockMvc.perform(post("/api/deals")
            .header(HttpHeaders.AUTHORIZATION, bearer(token))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(payload)))
        .andExpect(status().isOk())
        .andReturn();

    return readId(result);
  }

  private long createCredit(String token, long dealId, String amount) throws Exception {
    MvcResult result = mockMvc.perform(post("/api/credits/deal/{dealId}", dealId)
            .header(HttpHeaders.AUTHORIZATION, bearer(token))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("amount", amount))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.dealId").value(dealId))
        .andReturn();

    return readId(result);
  }

  private long createPayment(String token, long dealId, String amount) throws Exception {
    MvcResult result = mockMvc.perform(post("/api/payments")
            .header(HttpHeaders.AUTHORIZATION, bearer(token))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "dealId", dealId,
                "amount", amount
            ))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.dealId").value(dealId))
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
