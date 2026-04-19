package com.example.realestate.marketplace;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MarketplaceFlowIntegrationTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private ObjectMapper objectMapper;

  @Test
  void publicListingsNearbyAndCurrentUserWork() throws Exception {
    AuthSession owner = registerUser("owner");
    long listingId = createListing(owner.token(), "Smoke rent listing");
    long nearbyListingId = createListing(owner.token(), "Nearby rent listing", "55.7610", "37.6200");

    mockMvc.perform(get("/posts"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[*].id", hasItem((int) listingId)))
        .andExpect(jsonPath("$[*].title", hasItem("Smoke rent listing")));

    mockMvc.perform(get("/posts/{id}", listingId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(listingId))
        .andExpect(jsonPath("$.user.username").value(owner.username()))
        .andExpect(jsonPath("$.postDetail.desc").value("Smoke description"))
        .andExpect(jsonPath("$.imageGallery[*].category", hasItem("exterior")))
        .andExpect(jsonPath("$.imageGallery[*].category", hasItem("interior")))
        .andExpect(jsonPath("$.imageGallery[*].category", hasItem("floorplan")));

    mockMvc.perform(get("/posts/nearby")
            .param("latitude", "55.7558")
            .param("longitude", "37.6173")
            .param("type", "rent"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[*].id", hasItem((int) nearbyListingId)))
        .andExpect(jsonPath("$[*].title", hasItem("Nearby rent listing")));

    mockMvc.perform(get("/api/me").header(HttpHeaders.AUTHORIZATION, bearer(owner.token())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(owner.userId()))
        .andExpect(jsonPath("$.username").value(owner.username()))
        .andExpect(jsonPath("$.email").value(owner.email()));
  }

  @Test
  void favoritesAndProfileListingsWork() throws Exception {
    AuthSession owner = registerUser("landlord");
    long listingId = createListing(owner.token(), "Saved listing");
    AuthSession viewer = registerUser("viewer");

    mockMvc.perform(post("/api/favorites/toggle")
            .header(HttpHeaders.AUTHORIZATION, bearer(viewer.token()))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("postId", listingId))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.message").value("Post saved"));

    mockMvc.perform(get("/api/profile/listings").header(HttpHeaders.AUTHORIZATION, bearer(owner.token())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.userPosts[*].id", hasItem((int) listingId)));

    mockMvc.perform(get("/api/profile/listings").header(HttpHeaders.AUTHORIZATION, bearer(viewer.token())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.savedPosts[*].id", hasItem((int) listingId)));
  }

  @Test
  void savedListingPriceAlertsTrackDropsAndCanBeMuted() throws Exception {
    AuthSession owner = registerUser("priceowner");
    long listingId = createListing(owner.token(), "Watched listing");
    AuthSession viewer = registerUser("priceviewer");

    mockMvc.perform(post("/api/favorites/toggle")
            .header(HttpHeaders.AUTHORIZATION, bearer(viewer.token()))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("postId", listingId))))
        .andExpect(status().isOk());

    mockMvc.perform(put("/api/listings/{id}", listingId)
            .header(HttpHeaders.AUTHORIZATION, bearer(owner.token()))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(listingPayload("Watched listing", "rent", 120000L))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.price").value(120000));

    mockMvc.perform(get("/api/profile/listings").header(HttpHeaders.AUTHORIZATION, bearer(viewer.token())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.savedPosts[0].savedPrice").value(150000))
        .andExpect(jsonPath("$.savedPosts[0].priceAlertEnabled").value(true))
        .andExpect(jsonPath("$.savedPosts[0].priceDropAmount").value(30000))
        .andExpect(jsonPath("$.savedPosts[0].priceDropDetected").value(true));

    mockMvc.perform(post("/api/favorites/price-alert")
            .header(HttpHeaders.AUTHORIZATION, bearer(viewer.token()))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "postId", listingId,
                "enabled", false
            ))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.enabled").value(false));

    mockMvc.perform(get("/api/profile/listings").header(HttpHeaders.AUTHORIZATION, bearer(viewer.token())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.savedPosts[0].priceAlertEnabled").value(false));
  }

  @Test
  void ownerCanUpdateAndArchiveListing() throws Exception {
    AuthSession owner = registerUser("editor");
    long listingId = createListing(owner.token(), "Editable listing");
    AuthSession stranger = registerUser("stranger");

    mockMvc.perform(put("/api/listings/{id}", listingId)
            .header(HttpHeaders.AUTHORIZATION, bearer(stranger.token()))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(listingPayload("Illegal update", "rent"))))
        .andExpect(status().isNotFound());

    mockMvc.perform(put("/api/listings/{id}", listingId)
            .header(HttpHeaders.AUTHORIZATION, bearer(owner.token()))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(listingPayload("Updated listing", "buy"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value("Updated listing"))
        .andExpect(jsonPath("$.type").value("buy"));

    mockMvc.perform(delete("/api/listings/{id}", listingId)
            .header(HttpHeaders.AUTHORIZATION, bearer(owner.token())))
        .andExpect(status().isNoContent());

    mockMvc.perform(get("/api/listings/{id}", listingId))
        .andExpect(status().isNotFound());
  }

  @Test
  void marketplaceUserCanOpenSupportChatAndSendMessage() throws Exception {
    AuthSession customer = registerUser("chatuser");

    mockMvc.perform(get("/api/support-chat").header(HttpHeaders.AUTHORIZATION, bearer(customer.token())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.assignedRealtor.username").value("realtor"))
        .andExpect(jsonPath("$.messages[0].senderLabel").value("RomanEstate"));

    mockMvc.perform(post("/api/support-chat/messages")
            .header(HttpHeaders.AUTHORIZATION, bearer(customer.token()))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("text", "I need help with this listing"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.assignedRealtor.username").value("realtor"))
        .andExpect(jsonPath("$.messages[1].text").value("I need help with this listing"))
        .andExpect(jsonPath("$.messages[1].senderLabel").value("You"))
        .andExpect(jsonPath("$.messages[1].mine").value(true));
  }

  @Test
  void publishingListingWithoutRequiredPhotoCategoriesFails() throws Exception {
    AuthSession owner = registerUser("nophoto");

    mockMvc.perform(post("/api/listings")
            .header(HttpHeaders.AUTHORIZATION, bearer(owner.token()))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(listingPayloadWithoutImages("Missing gallery listing", "rent"))))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("Listing must include at least one exterior, interior and floor plan image before publishing"));
  }

  @Test
  void marketplaceDealsAndStaffSupportFlowWorkTogether() throws Exception {
    AuthSession owner = registerUser("seller");
    AuthSession customer = registerUser("buyer");
    long listingId = createListing(owner.token(), "Deal-ready listing");

    MvcResult createdDeal = mockMvc.perform(post("/api/marketplace-deals")
            .header(HttpHeaders.AUTHORIZATION, bearer(customer.token()))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "postId", listingId,
                "note", "Need a quick viewing and mortgage guidance"
            ))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.postId").value(listingId))
        .andExpect(jsonPath("$.status").value("REQUESTED"))
        .andExpect(jsonPath("$.customer.username").value(customer.username()))
        .andReturn();

    long marketplaceDealId = objectMapper.readTree(createdDeal.getResponse().getContentAsString()).path("id").asLong();

    mockMvc.perform(get("/api/profile/listings").header(HttpHeaders.AUTHORIZATION, bearer(customer.token())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.deals[*].id", hasItem((int) marketplaceDealId)))
        .andExpect(jsonPath("$.deals[*].postId", hasItem((int) listingId)));

    mockMvc.perform(post("/api/support-chat/messages")
            .header(HttpHeaders.AUTHORIZATION, bearer(customer.token()))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("text", "Can we review financing options?"))))
        .andExpect(status().isOk());

    String realtorToken = internalLogin("realtor@example.com");

    mockMvc.perform(get("/api/internal/marketplace-deals").header(HttpHeaders.AUTHORIZATION, bearer(realtorToken)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[*].id", hasItem((int) marketplaceDealId)))
        .andExpect(jsonPath("$.content[*].postId", hasItem((int) listingId)));

    mockMvc.perform(put("/api/internal/marketplace-deals/{id}/status", marketplaceDealId)
            .header(HttpHeaders.AUTHORIZATION, bearer(realtorToken))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("status", "IN_REVIEW"))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("IN_REVIEW"));

    MvcResult conversationList = mockMvc.perform(get("/api/internal/support-chat/conversations")
            .header(HttpHeaders.AUTHORIZATION, bearer(realtorToken)))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.content[*].customer.username", hasItem(customer.username())))
        .andReturn();

    JsonNode conversations = objectMapper.readTree(conversationList.getResponse().getContentAsString())
        .path("content");
    long conversationId = -1;
    for (JsonNode conversation : conversations) {
      if (customer.username().equals(conversation.path("customer").path("username").asText())) {
        conversationId = conversation.path("conversationId").asLong();
        break;
      }
    }
    if (conversationId <= 0) {
      throw new IllegalStateException("Conversation for test customer was not found in staff list");
    }

    mockMvc.perform(post("/api/internal/support-chat/conversations/{id}/messages", conversationId)
            .header(HttpHeaders.AUTHORIZATION, bearer(realtorToken))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of("text", "Absolutely. I will prepare the financing options today."))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.messages[*].senderLabel", hasItem("Realtor")))
        .andExpect(jsonPath("$.messages[*].text", hasItem("Absolutely. I will prepare the financing options today.")));

    mockMvc.perform(get("/api/support-chat").header(HttpHeaders.AUTHORIZATION, bearer(customer.token())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.messages[*].text", hasItem("Absolutely. I will prepare the financing options today.")));

    mockMvc.perform(get("/api/profile/listings").header(HttpHeaders.AUTHORIZATION, bearer(customer.token())))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.deals[0].status").value("IN_REVIEW"));
  }

  private AuthSession registerUser(String prefix) throws Exception {
    String suffix = UUID.randomUUID().toString().substring(0, 8);
    String username = prefix + suffix;
    String email = username + "@example.com";

    MvcResult result = mockMvc.perform(post("/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(Map.of(
                "username", username,
                "email", email,
                "password", "Password123!",
                "mobile_number", "9000000000"
            ))))
        .andExpect(status().isCreated())
        .andExpect(cookie().exists("token"))
        .andReturn();

    JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
    return new AuthSession(
        body.path("id").asLong(),
        body.path("username").asText(),
        body.path("email").asText(),
        body.path("token").asText()
    );
  }

  private long createListing(String token, String title) throws Exception {
    return createListing(token, title, "55.7558", "37.6173");
  }

  private long createListing(String token, String title, String latitude, String longitude) throws Exception {
    MvcResult result = mockMvc.perform(post("/api/listings")
            .header(HttpHeaders.AUTHORIZATION, bearer(token))
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(listingPayload(title, "rent", latitude, longitude))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value(title))
        .andReturn();

    return objectMapper.readTree(result.getResponse().getContentAsString()).path("id").asLong();
  }

  private Map<String, Object> listingPayload(String title, String type) {
    return listingPayload(title, type, "55.7558", "37.6173");
  }

  private Map<String, Object> listingPayload(String title, String type, String latitude, String longitude) {
    return listingPayload(title, type, 150000L, latitude, longitude);
  }

  private Map<String, Object> listingPayload(String title, String type, Long price) {
    return listingPayload(title, type, price, "55.7558", "37.6173");
  }

  private Map<String, Object> listingPayload(String title, String type, Long price, String latitude, String longitude) {
    return Map.of(
        "postData", Map.ofEntries(
            Map.entry("title", title),
            Map.entry("price", price),
            Map.entry("address", "Test address 1"),
            Map.entry("city", "Moscow"),
            Map.entry("bedroom", 2),
            Map.entry("bathroom", 1),
            Map.entry("type", type),
            Map.entry("property", "apartment"),
            Map.entry("latitude", latitude),
            Map.entry("longitude", longitude),
            Map.entry("published", true),
            Map.entry("images", requiredImageUrls(title)),
            Map.entry("imageGallery", requiredImageGallery(title))
        ),
        "postDetail", Map.of(
            "desc", "Smoke description",
            "utilities", "owner",
            "pet", "allowed",
            "income", "stable",
            "size", 55,
            "school", 1,
            "bus", 1,
            "restaurant", 1
        )
    );
  }

  private Map<String, Object> listingPayloadWithoutImages(String title, String type) {
    return Map.of(
        "postData", Map.ofEntries(
            Map.entry("title", title),
            Map.entry("price", 150000),
            Map.entry("address", "Test address 1"),
            Map.entry("city", "Moscow"),
            Map.entry("bedroom", 2),
            Map.entry("bathroom", 1),
            Map.entry("type", type),
            Map.entry("property", "apartment"),
            Map.entry("latitude", "55.7558"),
            Map.entry("longitude", "37.6173"),
            Map.entry("published", true),
            Map.entry("images", java.util.List.of()),
            Map.entry("imageGallery", java.util.List.of())
        ),
        "postDetail", Map.of(
            "desc", "Smoke description",
            "utilities", "owner",
            "pet", "allowed",
            "income", "stable",
            "size", 55,
            "school", 1,
            "bus", 1,
            "restaurant", 1
        )
    );
  }

  private List<String> requiredImageUrls(String seed) {
    return requiredImageGallery(seed).stream()
        .map(image -> image.get("url").toString())
        .toList();
  }

  private List<Map<String, Object>> requiredImageGallery(String seed) {
    String normalizedSeed = seed.toLowerCase().replace(' ', '-');
    return List.of(
        Map.of("url", "https://example.com/" + normalizedSeed + "-exterior.jpg", "category", "exterior"),
        Map.of("url", "https://example.com/" + normalizedSeed + "-interior.jpg", "category", "interior"),
        Map.of("url", "https://example.com/" + normalizedSeed + "-floorplan.jpg", "category", "floorplan")
    );
  }

  private String bearer(String token) {
    return "Bearer " + token;
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

  private record AuthSession(Long userId, String username, String email, String token) {
  }
}
