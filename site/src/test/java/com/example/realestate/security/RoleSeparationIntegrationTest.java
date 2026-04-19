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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class RoleSeparationIntegrationTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Test
  void publicAndInternalLoginsAreSeparated() throws Exception {
    mockMvc.perform(post("/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "username", "marketuser",
                "password", "Password123!"
            ))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value("marketuser"));

    String adminToken = internalLogin("admin@example.com");
    long realtyOrganizationId = organizationReferenceId(adminToken, "Demo Realty");

    mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, bearer(adminToken)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value("admin@example.com"))
        .andExpect(jsonPath("$.role").value("ROLE_ADMIN"));

    mockMvc.perform(post("/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "username", "admin",
                "password", "Password123!"
            ))))
        .andExpect(status().isForbidden());

    mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "email", "marketuser@example.com",
                "password", "Password123!"
            ))))
        .andExpect(status().isForbidden());

    mockMvc.perform(post("/api/auth/register")
            .header(HttpHeaders.AUTHORIZATION, bearer(adminToken))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "email", "staff-" + UUID.randomUUID() + "@example.com",
                "password", "Password123!",
                "role", "ROLE_REALTOR",
                "organizationId", realtyOrganizationId
            ))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token").isString());

    String realtorToken = internalLogin("realtor@example.com");
    mockMvc.perform(post("/api/auth/register")
            .header(HttpHeaders.AUTHORIZATION, bearer(realtorToken))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "email", "blocked-" + UUID.randomUUID() + "@example.com",
                "password", "Password123!",
                "role", "ROLE_BANK_EMPLOYEE",
                "organizationId", realtyOrganizationId
            ))))
        .andExpect(status().isForbidden());
  }

  @Test
  void marketplaceUsersCannotAccessInternalApisAndStaffCannotUseMarketplaceApis() throws Exception {
    String marketToken = publicLogin("marketuser");
    String realtorToken = internalLogin("realtor@example.com");

    mockMvc.perform(get("/api/deals").header(HttpHeaders.AUTHORIZATION, bearer(marketToken)))
        .andExpect(status().isForbidden());

    mockMvc.perform(get("/api/auth/me").header(HttpHeaders.AUTHORIZATION, bearer(marketToken)))
        .andExpect(status().isForbidden());

    mockMvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, bearer(realtorToken)))
        .andExpect(status().isForbidden());

    mockMvc.perform(get("/api/support-chat").header(HttpHeaders.AUTHORIZATION, bearer(realtorToken)))
        .andExpect(status().isForbidden());
  }

  @Test
  void internalRolePermissionsAreEnforced() throws Exception {
    String adminToken = internalLogin("admin@example.com");
    String realtorToken = internalLogin("realtor@example.com");
    String bankToken = internalLogin("bank@example.com");

    mockMvc.perform(get("/api/organizations").header(HttpHeaders.AUTHORIZATION, bearer(adminToken)))
        .andExpect(status().isOk());

    mockMvc.perform(get("/api/organizations").header(HttpHeaders.AUTHORIZATION, bearer(realtorToken)))
        .andExpect(status().isForbidden());

    mockMvc.perform(get("/api/deals").header(HttpHeaders.AUTHORIZATION, bearer(realtorToken)))
        .andExpect(status().isOk());

    mockMvc.perform(get("/api/deals").header(HttpHeaders.AUTHORIZATION, bearer(bankToken)))
        .andExpect(status().isForbidden());

    mockMvc.perform(get("/api/deals/reference").header(HttpHeaders.AUTHORIZATION, bearer(bankToken)))
        .andExpect(status().isOk());

    String organizationName = "Admin Org " + UUID.randomUUID();
    mockMvc.perform(post("/api/organizations")
            .header(HttpHeaders.AUTHORIZATION, bearer(adminToken))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "name", organizationName,
                "taxId", "TAX-" + UUID.randomUUID()
            ))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value(organizationName));

    mockMvc.perform(get("/api/organizations/reference").header(HttpHeaders.AUTHORIZATION, bearer(bankToken)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[*].name", hasItem("Demo Bank")));
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

  private String publicLogin(String username) throws Exception {
    MvcResult result = mockMvc.perform(post("/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "username", username,
                "password", "Password123!"
            ))))
        .andExpect(status().isOk())
        .andReturn();

    return readToken(result);
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

    return readToken(result);
  }

  private String readToken(MvcResult result) throws Exception {
    JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
    return body.path("token").asText();
  }

  private String bearer(String token) {
    return "Bearer " + token;
  }
}
