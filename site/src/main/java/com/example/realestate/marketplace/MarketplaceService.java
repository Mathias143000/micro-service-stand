package com.example.realestate.marketplace;

import com.example.realestate.favorite.Favorite;
import com.example.realestate.favorite.FavoriteRepository;
import com.example.realestate.property.Property;
import com.example.realestate.property.PropertyPhoto;
import com.example.realestate.property.PropertyPhotoCategory;
import com.example.realestate.property.PropertyPhotoRepository;
import com.example.realestate.property.PropertyRepository;
import com.example.realestate.property.PropertyStatus;
import com.example.realestate.property.PropertyType;
import com.example.realestate.security.JwtTokenProvider;
import com.example.realestate.user.User;
import com.example.realestate.user.UserRepository;
import com.example.realestate.user.UserRole;
import jakarta.persistence.criteria.Predicate;
import jakarta.transaction.Transactional;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Slf4j
@Service
public class MarketplaceService {

  private static final double MAX_NEARBY_DISTANCE_KM = 2.0;

  private final UserRepository userRepository;
  private final PropertyRepository propertyRepository;
  private final PropertyPhotoRepository propertyPhotoRepository;
  private final FavoriteRepository favoriteRepository;
  private final MarketplaceDealService marketplaceDealService;
  private final PasswordEncoder passwordEncoder;
  private final AuthenticationManager authenticationManager;
  private final JwtTokenProvider jwtTokenProvider;

  public MarketplaceService(
      UserRepository userRepository,
      PropertyRepository propertyRepository,
      PropertyPhotoRepository propertyPhotoRepository,
      FavoriteRepository favoriteRepository,
      MarketplaceDealService marketplaceDealService,
      PasswordEncoder passwordEncoder,
      AuthenticationManager authenticationManager,
      JwtTokenProvider jwtTokenProvider
  ) {
    this.userRepository = userRepository;
    this.propertyRepository = propertyRepository;
    this.propertyPhotoRepository = propertyPhotoRepository;
    this.favoriteRepository = favoriteRepository;
    this.marketplaceDealService = marketplaceDealService;
    this.passwordEncoder = passwordEncoder;
    this.authenticationManager = authenticationManager;
    this.jwtTokenProvider = jwtTokenProvider;
  }

  @Transactional
  public MarketplaceAuthResponse register(MarketplaceRegisterRequest request) {
    String email = normalizeEmail(request.getEmail());
    if (userRepository.existsByEmail(email)) {
      throw new ResponseStatusException(BAD_REQUEST, "Email already in use");
    }

    String username = normalizeUsername(request.getUsername());
    if (username == null) {
      throw new ResponseStatusException(BAD_REQUEST, "Username is required");
    }
    if (userRepository.existsByUsername(username)) {
      throw new ResponseStatusException(BAD_REQUEST, "Username already in use");
    }

    User user = new User();
    user.setEmail(email);
    user.setUsername(username);
    user.setFullName(username);
    user.setPhone(blankToNull(request.getMobile_number()));
    user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    user.setRole(UserRole.ROLE_MARKETPLACE_USER);
    user.setEnabled(true);

    User saved = userRepository.save(user);
    String token = jwtTokenProvider.generateToken(saved.getEmail(), saved.getRole().name());
    return toAuthResponse(saved, token);
  }

  public MarketplaceAuthResponse login(MarketplaceLoginRequest request) {
    String identifier = blankToNull(request.getUsername());
    if (identifier == null) {
      throw new ResponseStatusException(BAD_REQUEST, "Username is required");
    }

    User user = userRepository.findByEmailOrUsername(identifier, identifier)
        .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Invalid credentials"));

    if (user.getRole() != UserRole.ROLE_MARKETPLACE_USER) {
      throw new ResponseStatusException(FORBIDDEN, "Use the internal staff login");
    }

    try {
      authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(identifier, request.getPassword()));
    } catch (Exception ex) {
      throw new ResponseStatusException(UNAUTHORIZED, "Invalid credentials");
    }

    String token = jwtTokenProvider.generateToken(user.getEmail(), user.getRole().name());
    return toAuthResponse(user, token);
  }

  public MarketplaceUserResponse getCurrentUserProfile() {
    return toMarketplaceUserResponse(requireMarketplaceUser());
  }

  public MarketplaceUserResponse getPublicUser(Long id) {
    User user = userRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "User not found"));
    return toMarketplaceUserResponse(user);
  }

  @Transactional
  public MarketplaceAuthResponse updateCurrentUser(Long id, MarketplaceUserUpdateRequest request) {
    User currentUser = requireMarketplaceUser();
    if (!currentUser.getId().equals(id)) {
      throw new ResponseStatusException(FORBIDDEN, "Not Authorized!");
    }

    String requestedUsername = normalizeUsername(request.getUsername());
    if (requestedUsername != null && !requestedUsername.equals(currentUser.getUsername())) {
      if (userRepository.existsByUsername(requestedUsername)) {
        throw new ResponseStatusException(BAD_REQUEST, "Username already in use");
      }
      currentUser.setUsername(requestedUsername);
      currentUser.setFullName(requestedUsername);
    }

    String requestedEmail = normalizeEmail(request.getEmail());
    if (requestedEmail != null && !requestedEmail.equalsIgnoreCase(currentUser.getEmail())) {
      if (userRepository.existsByEmail(requestedEmail)) {
        throw new ResponseStatusException(BAD_REQUEST, "Email already in use");
      }
      currentUser.setEmail(requestedEmail);
    }

    if (hasText(request.getPassword())) {
      currentUser.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    }

    if (request.getMobile_number() != null) {
      currentUser.setPhone(blankToNull(request.getMobile_number()));
    }
    if (request.getAvatar() != null) {
      currentUser.setAvatar(blankToNull(request.getAvatar()));
    }

    String token = jwtTokenProvider.generateToken(currentUser.getEmail(), currentUser.getRole().name());
    return toAuthResponse(currentUser, token);
  }

  @Transactional
  public List<MarketplacePostResponse> listPosts(
      String city,
      String type,
      String property,
      Integer bedroom,
      Long minPrice,
      Long maxPrice
  ) {
    User currentUser = getCurrentUserOrNull();

    List<Property> properties = propertyRepository.findAll((root, query, cb) -> {
      List<Predicate> predicates = baseMarketplacePredicates(root, cb);

      if (hasText(city)) {
        predicates.add(cb.equal(cb.lower(root.get("city")), city.trim().toLowerCase(Locale.ROOT)));
      }
      if (hasText(property)) {
        predicates.add(cb.equal(cb.lower(root.get("listingCategory")), property.trim().toLowerCase(Locale.ROOT)));
      }
      if (bedroom != null) {
        predicates.add(cb.equal(root.get("bedroom"), bedroom));
      }

      PropertyType propertyType = parseFrontType(type);
      if (propertyType != null) {
        predicates.add(cb.equal(root.get("type"), propertyType));
      }

      addPricePredicates(predicates, root, cb, propertyType, minPrice, maxPrice);
      return cb.and(predicates.toArray(new Predicate[0]));
    }, Sort.by(Sort.Direction.DESC, "createdAt"));

    return properties.stream()
        .map(propertyItem -> toMarketplacePostResponse(propertyItem, currentUser))
        .toList();
  }

  @Transactional
  public MarketplacePostResponse getPost(Long id) {
    Property property = getMarketplaceProperty(id);
    return toMarketplacePostResponse(property, getCurrentUserOrNull());
  }

  @Transactional
  public MarketplacePostResponse createPost(MarketplacePostRequest request) {
    User currentUser = requireMarketplaceUser();

    Property property = new Property();
    property.setOwner(currentUser);
    property.setOrganization(currentUser.getOrganization());
    property.setPublished(resolveRequestedPublished(request.getPostData()));
    property.setStatus(PropertyStatus.AVAILABLE);
    applyPostRequest(property, request);

    Property saved = propertyRepository.save(property);
    syncPhotos(saved, request.getPostData());
    validateRequiredPhotoCoverage(saved, resolveRequestedPublished(request.getPostData()));
    return toMarketplacePostResponse(saved, currentUser);
  }

  @Transactional
  public MarketplacePostResponse updatePost(Long id, MarketplacePostRequest request) {
    User currentUser = requireMarketplaceUser();
    Property property = propertyRepository.findByIdAndOwnerId(id, currentUser.getId())
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Post not found"));

    if (!isMarketplaceProperty(property)) {
      throw new ResponseStatusException(NOT_FOUND, "Post not found");
    }

    applyPostRequest(property, request);
    property.setPublished(resolveRequestedPublished(request.getPostData()));
    syncPhotos(property, request.getPostData());
    validateRequiredPhotoCoverage(property, resolveRequestedPublished(request.getPostData()));
    return toMarketplacePostResponse(property, currentUser);
  }

  @Transactional
  public void deletePost(Long id) {
    User currentUser = requireMarketplaceUser();
    Property property = propertyRepository.findByIdAndOwnerId(id, currentUser.getId())
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Post not found"));

    property.setPublished(false);
    property.setStatus(PropertyStatus.ARCHIVED);
  }

  @Transactional
  public List<MarketplacePostResponse> nearbyPosts(String latitude, String longitude, String type) {
    double sourceLat = parseCoordinate(latitude, "latitude");
    double sourceLon = parseCoordinate(longitude, "longitude");
    User currentUser = getCurrentUserOrNull();
    PropertyType requestedType = parseFrontType(type);

    List<Property> properties = propertyRepository.findAll((root, query, cb) -> {
      List<Predicate> predicates = baseMarketplacePredicates(root, cb);
      predicates.add(cb.isNotNull(root.get("latitude")));
      predicates.add(cb.isNotNull(root.get("longitude")));
      if (requestedType != null) {
        predicates.add(cb.equal(root.get("type"), requestedType));
      }
      return cb.and(predicates.toArray(new Predicate[0]));
    });

    return properties.stream()
        .filter(property -> property.getLatitude() != null && property.getLongitude() != null)
        .filter(property -> {
          double distance = haversineDistance(
              sourceLat,
              sourceLon,
              property.getLatitude().doubleValue(),
              property.getLongitude().doubleValue()
          );
          return distance > 0 && distance <= MAX_NEARBY_DISTANCE_KM;
        })
        .sorted((left, right) -> Double.compare(
            haversineDistance(sourceLat, sourceLon, left.getLatitude().doubleValue(), left.getLongitude().doubleValue()),
            haversineDistance(sourceLat, sourceLon, right.getLatitude().doubleValue(), right.getLongitude().doubleValue())
        ))
        .map(property -> toMarketplacePostResponse(property, currentUser))
        .toList();
  }

  @Transactional
  public String toggleSavedPost(Long postId) {
    User currentUser = requireMarketplaceUser();
    Property property = getMarketplaceProperty(postId);

    Optional<Favorite> existing = favoriteRepository.findByUserIdAndPropertyId(currentUser.getId(), postId);
    if (existing.isPresent()) {
      favoriteRepository.delete(existing.get());
      return "Post removed from saved list";
    }

    Favorite favorite = new Favorite();
    favorite.setUser(currentUser);
    favorite.setProperty(property);
    favorite.setSavedPrice(BigDecimal.valueOf(toResponsePrice(property)));
    favorite.setPriceAlertEnabled(true);
    favoriteRepository.save(favorite);
    return "Post saved";
  }

  @Transactional
  public boolean updatePriceAlert(Long postId, boolean enabled) {
    User currentUser = requireMarketplaceUser();
    Favorite favorite = favoriteRepository.findByUserIdAndPropertyId(currentUser.getId(), postId)
        .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Save the listing before managing price alerts"));

    favorite.setPriceAlertEnabled(enabled);
    if (favorite.getSavedPrice() == null) {
      favorite.setSavedPrice(BigDecimal.valueOf(toResponsePrice(favorite.getProperty())));
    }
    return favorite.isPriceAlertEnabled();
  }

  @Transactional
  public MarketplaceProfilePostsResponse getProfilePosts() {
    User currentUser = requireMarketplaceUser();

    List<MarketplacePostResponse> userPosts = propertyRepository.findByOwnerIdOrderByCreatedAtDesc(currentUser.getId())
        .stream()
        .filter(this::isMarketplaceProperty)
        .filter(property -> property.isPublished() && property.getStatus() != PropertyStatus.ARCHIVED)
        .map(property -> toMarketplacePostResponse(property, currentUser))
        .toList();

    List<MarketplacePostResponse> savedPosts = favoriteRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId())
        .stream()
        .filter(favorite -> isMarketplaceProperty(favorite.getProperty()))
        .filter(favorite -> favorite.getProperty().isPublished() && favorite.getProperty().getStatus() != PropertyStatus.ARCHIVED)
        .map(favorite -> toMarketplacePostResponse(favorite.getProperty(), currentUser, favorite))
        .toList();

    return new MarketplaceProfilePostsResponse(
        userPosts,
        savedPosts,
        marketplaceDealService.listCurrentUserDealsForProfile(currentUser)
    );
  }

  private void applyPostRequest(Property property, MarketplacePostRequest request) {
    MarketplacePostDataRequest postData = request.getPostData();
    MarketplacePostDetailRequest detail = request.getPostDetail();

    property.setTitle(postData.getTitle().trim());
    property.setAddress(postData.getAddress().trim());
    property.setCity(postData.getCity().trim().toLowerCase(Locale.ROOT));
    property.setBedroom(postData.getBedroom());
    property.setBathroom(postData.getBathroom());
    property.setLatitude(toCoordinate(postData.getLatitude(), "latitude"));
    property.setLongitude(toCoordinate(postData.getLongitude(), "longitude"));
    property.setListingCategory(normalizeCategory(postData.getProperty()));
    property.setType(requireFrontType(postData.getType()));
    property.setArea(toArea(detail.getSize()));
    property.setDescription(blankToNull(detail.getDesc()));
    property.setUtilities(blankToNull(detail.getUtilities()));
    property.setPetPolicy(blankToNull(detail.getPet()));
    property.setIncomePolicy(blankToNull(detail.getIncome()));
    property.setSchoolDistanceKm(detail.getSchool());
    property.setBusDistanceKm(detail.getBus());
    property.setRestaurantDistanceKm(detail.getRestaurant());
    property.setPurpose(normalizeCategory(postData.getProperty()));
    PropertyType propertyType = property.getType();
    if (propertyType == PropertyType.FOR_RENT) {
      property.setRentPrice(toPrice(postData.getPrice()));
      property.setPurchasePrice(null);
    } else {
      property.setPurchasePrice(toPrice(postData.getPrice()));
      property.setRentPrice(null);
    }
  }

  private void syncPhotos(Property property, MarketplacePostDataRequest postData) {
    List<MarketplaceImageReferenceRequest> requestedGallery = normalizeRequestedGallery(property, postData);
    List<PropertyPhoto> existingPhotos = propertyPhotoRepository.findByPropertyIdOrderByCreatedAtAsc(property.getId());
    Map<Long, PropertyPhoto> existingById = existingPhotos.stream()
        .filter(photo -> photo.getId() != null)
        .collect(Collectors.toMap(PropertyPhoto::getId, photo -> photo, (left, right) -> left, HashMap::new));
    Set<Long> referencedIds = new LinkedHashSet<>();

    for (MarketplaceImageReferenceRequest reference : requestedGallery) {
      PropertyPhotoCategory category = normalizePhotoCategory(reference.getCategory());

      if (reference.getId() != null && existingById.containsKey(reference.getId())) {
        PropertyPhoto existing = existingById.get(reference.getId());
        existing.setCategory(category);
        referencedIds.add(existing.getId());
        continue;
      }

      PropertyPhoto matchedByUrl = findExistingPhotoByUrl(existingPhotos, blankToNull(reference.getUrl()));
      if (matchedByUrl != null) {
        matchedByUrl.setCategory(category);
        referencedIds.add(matchedByUrl.getId());
        continue;
      }

      String imageUrl = blankToNull(reference.getUrl());
      if (imageUrl != null && isExternalUrl(imageUrl)) {
        PropertyPhoto photo = new PropertyPhoto();
        photo.setProperty(property);
        photo.setPath(imageUrl);
        photo.setCategory(category);
        PropertyPhoto saved = propertyPhotoRepository.save(photo);
        referencedIds.add(saved.getId());
      }
    }

    for (PropertyPhoto photo : existingPhotos) {
      if (!referencedIds.contains(photo.getId())) {
        deleteLocalFileIfExists(photo.getPath());
        propertyPhotoRepository.delete(photo);
      }
    }
  }

  private void deleteLocalFileIfExists(String pathValue) {
    if (pathValue == null || isExternalUrl(pathValue)) {
      return;
    }

    try {
      Path path = Paths.get(pathValue);
      if (Files.exists(path)) {
        Files.delete(path);
      }
    } catch (Exception ex) {
      log.warn("Failed to delete local file {}", pathValue, ex);
    }
  }

  private MarketplacePostResponse toMarketplacePostResponse(Property property, User viewer) {
    return toMarketplacePostResponse(property, viewer, null);
  }

  private MarketplacePostResponse toMarketplacePostResponse(Property property, User viewer, Favorite favorite) {
    User owner = property.getOwner();
    MarketplaceUserResponse ownerResponse = owner == null ? null : toMarketplaceUserResponse(owner);
    Long ownerId = owner == null ? null : owner.getId();
    boolean isSaved = favorite != null || (viewer != null && favoriteRepository.existsByUserIdAndPropertyId(viewer.getId(), property.getId()));
    FavoriteAlertSnapshot alertSnapshot = buildFavoriteAlertSnapshot(property, favorite);

    MarketplacePostDetailResponse detailResponse = new MarketplacePostDetailResponse(
        property.getDescription(),
        property.getUtilities(),
        property.getPetPolicy(),
        property.getIncomePolicy(),
        property.getArea() == null ? null : property.getArea().setScale(0, RoundingMode.HALF_UP).intValue(),
        property.getSchoolDistanceKm(),
        property.getBusDistanceKm(),
        property.getRestaurantDistanceKm()
    );

    List<MarketplaceImageResponse> imageGallery = resolveImageGallery(property);

    return new MarketplacePostResponse(
        property.getId(),
        property.getTitle(),
        toResponsePrice(property),
        imageGallery.stream().map(MarketplaceImageResponse::url).toList(),
        imageGallery,
        property.getAddress(),
        property.getCity(),
        property.getBedroom(),
        property.getBathroom(),
        property.getLatitude() == null ? null : property.getLatitude().stripTrailingZeros().toPlainString(),
        property.getLongitude() == null ? null : property.getLongitude().stripTrailingZeros().toPlainString(),
        toFrontType(property.getType()),
        property.getListingCategory(),
        ownerId,
        ownerResponse,
        detailResponse,
        isSaved,
        alertSnapshot.savedPrice(),
        alertSnapshot.priceAlertEnabled(),
        alertSnapshot.priceDropAmount(),
        alertSnapshot.priceDropDetected()
    );
  }

  private FavoriteAlertSnapshot buildFavoriteAlertSnapshot(Property property, Favorite favorite) {
    if (favorite == null) {
      return new FavoriteAlertSnapshot(null, false, 0L, false);
    }

    Long currentPrice = toResponsePrice(property);
    Long savedPrice = favorite.getSavedPrice() == null
        ? currentPrice
        : favorite.getSavedPrice().setScale(0, RoundingMode.HALF_UP).longValue();
    long priceDropAmount = savedPrice != null && currentPrice < savedPrice ? savedPrice - currentPrice : 0L;

    return new FavoriteAlertSnapshot(
        savedPrice,
        favorite.isPriceAlertEnabled(),
        priceDropAmount,
        priceDropAmount > 0
    );
  }

  private record FavoriteAlertSnapshot(
      Long savedPrice,
      boolean priceAlertEnabled,
      Long priceDropAmount,
      boolean priceDropDetected
  ) {
  }

  private MarketplaceAuthResponse toAuthResponse(User user, String token) {
    MarketplaceUserResponse profile = toMarketplaceUserResponse(user);
    return new MarketplaceAuthResponse(
        profile.id(),
        profile.username(),
        profile.email(),
        profile.avatar(),
        profile.mobile_number(),
        token
    );
  }

  private MarketplaceUserResponse toMarketplaceUserResponse(User user) {
    return new MarketplaceUserResponse(
        user.getId(),
        displayUsername(user),
        user.getEmail(),
        user.getAvatar(),
        user.getPhone()
    );
  }

  private List<MarketplaceImageResponse> resolveImageGallery(Property property) {
    return propertyPhotoRepository.findByPropertyIdOrderByCreatedAtAsc(property.getId()).stream()
        .sorted(Comparator.comparingInt(photo -> sortOrder(photo.getCategory())))
        .map(photo -> new MarketplaceImageResponse(
            photo.getId(),
            resolveImageUrl(photo),
            toCategoryValue(photo.getCategory())
        ))
        .toList();
  }

  private String resolveImageUrl(PropertyPhoto photo) {
    return isExternalUrl(photo.getPath()) ? photo.getPath() : "/api/images/" + photo.getId();
  }

  private List<MarketplaceImageReferenceRequest> normalizeRequestedGallery(
      Property property,
      MarketplacePostDataRequest postData
  ) {
    if (postData.getImageGallery() != null && !postData.getImageGallery().isEmpty()) {
      return postData.getImageGallery();
    }

    List<PropertyPhoto> existingPhotos = property.getId() == null
        ? List.of()
        : propertyPhotoRepository.findByPropertyIdOrderByCreatedAtAsc(property.getId());

    return postData.getImages() == null
        ? List.of()
        : postData.getImages().stream()
            .map(this::blankToNull)
            .filter(value -> value != null)
            .map(value -> legacyImageReference(existingPhotos, value))
            .toList();
  }

  private MarketplaceImageReferenceRequest legacyImageReference(List<PropertyPhoto> existingPhotos, String value) {
    MarketplaceImageReferenceRequest reference = new MarketplaceImageReferenceRequest();
    reference.setUrl(value);

    PropertyPhoto matched = findExistingPhotoByUrl(existingPhotos, value);
    if (matched != null) {
      reference.setId(matched.getId());
      reference.setCategory(toCategoryValue(matched.getCategory()));
    } else {
      reference.setCategory("exterior");
    }

    return reference;
  }

  private PropertyPhoto findExistingPhotoByUrl(List<PropertyPhoto> existingPhotos, String url) {
    if (url == null) {
      return null;
    }

    return existingPhotos.stream()
        .filter(photo -> url.equals(resolveImageUrl(photo)) || url.equals(photo.getPath()))
        .findFirst()
        .orElse(null);
  }

  private void validateRequiredPhotoCoverage(Property property, boolean published) {
    if (!published) {
      return;
    }

    List<PropertyPhoto> photos = propertyPhotoRepository.findByPropertyIdOrderByCreatedAtAsc(property.getId());
    Set<PropertyPhotoCategory> categories = photos.stream()
        .map(photo -> photo.getCategory() == null ? PropertyPhotoCategory.EXTERIOR : photo.getCategory())
        .collect(Collectors.toSet());

    List<String> missingCategories = new ArrayList<>();
    if (!categories.contains(PropertyPhotoCategory.EXTERIOR)) {
      missingCategories.add("exterior");
    }
    if (!categories.contains(PropertyPhotoCategory.INTERIOR)) {
      missingCategories.add("interior");
    }
    if (!categories.contains(PropertyPhotoCategory.FLOOR_PLAN)) {
      missingCategories.add("floorplan");
    }

    if (!missingCategories.isEmpty()) {
      throw new ResponseStatusException(
          BAD_REQUEST,
          "Listing must include at least one exterior, interior and floor plan image before publishing"
      );
    }
  }

  private boolean resolveRequestedPublished(MarketplacePostDataRequest postData) {
    return postData.getPublished() == null || postData.getPublished();
  }

  private PropertyPhotoCategory normalizePhotoCategory(String value) {
    if (!hasText(value)) {
      return PropertyPhotoCategory.EXTERIOR;
    }

    return switch (value.trim().toLowerCase(Locale.ROOT)) {
      case "exterior", "facade" -> PropertyPhotoCategory.EXTERIOR;
      case "interior", "inside" -> PropertyPhotoCategory.INTERIOR;
      case "floorplan", "floor_plan", "plan" -> PropertyPhotoCategory.FLOOR_PLAN;
      default -> throw new ResponseStatusException(BAD_REQUEST, "Unsupported photo category");
    };
  }

  private String toCategoryValue(PropertyPhotoCategory category) {
    if (category == null) {
      return "exterior";
    }

    return switch (category) {
      case EXTERIOR -> "exterior";
      case INTERIOR -> "interior";
      case FLOOR_PLAN -> "floorplan";
    };
  }

  private int sortOrder(PropertyPhotoCategory category) {
    if (category == null) {
      return 0;
    }

    return switch (category) {
      case EXTERIOR -> 0;
      case INTERIOR -> 1;
      case FLOOR_PLAN -> 2;
    };
  }

  private boolean isExternalUrl(String value) {
    return value != null && (value.startsWith("http://") || value.startsWith("https://"));
  }

  private Property getMarketplaceProperty(Long id) {
    Property property = propertyRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Post not found"));
    if (!isMarketplaceProperty(property) || !property.isPublished() || property.getStatus() == PropertyStatus.ARCHIVED) {
      throw new ResponseStatusException(NOT_FOUND, "Post not found");
    }
    return property;
  }

  private boolean isMarketplaceProperty(Property property) {
    return property.getOwner() != null;
  }

  private List<Predicate> baseMarketplacePredicates(
      jakarta.persistence.criteria.Root<Property> root,
      jakarta.persistence.criteria.CriteriaBuilder cb
  ) {
    List<Predicate> predicates = new ArrayList<>();
    predicates.add(cb.isNotNull(root.get("owner")));
    predicates.add(cb.isTrue(root.get("published")));
    predicates.add(cb.notEqual(root.get("status"), PropertyStatus.ARCHIVED));
    return predicates;
  }

  private void addPricePredicates(
      List<Predicate> predicates,
      jakarta.persistence.criteria.Root<Property> root,
      jakarta.persistence.criteria.CriteriaBuilder cb,
      PropertyType propertyType,
      Long minPrice,
      Long maxPrice
  ) {
    if (minPrice == null && maxPrice == null) {
      return;
    }

    BigDecimal minValue = minPrice == null ? null : BigDecimal.valueOf(minPrice);
    BigDecimal maxValue = maxPrice == null ? null : BigDecimal.valueOf(maxPrice);

    if (propertyType == PropertyType.FOR_RENT) {
      if (minValue != null) {
        predicates.add(cb.greaterThanOrEqualTo(root.get("rentPrice"), minValue));
      }
      if (maxValue != null) {
        predicates.add(cb.lessThanOrEqualTo(root.get("rentPrice"), maxValue));
      }
      return;
    }

    if (propertyType == PropertyType.FOR_SALE) {
      if (minValue != null) {
        predicates.add(cb.greaterThanOrEqualTo(root.get("purchasePrice"), minValue));
      }
      if (maxValue != null) {
        predicates.add(cb.lessThanOrEqualTo(root.get("purchasePrice"), maxValue));
      }
      return;
    }

    if (minValue != null) {
      Predicate purchaseMin = cb.greaterThanOrEqualTo(root.get("purchasePrice"), minValue);
      Predicate rentMin = cb.greaterThanOrEqualTo(root.get("rentPrice"), minValue);
      predicates.add(cb.or(purchaseMin, rentMin));
    }
    if (maxValue != null) {
      Predicate purchaseMax = cb.lessThanOrEqualTo(root.get("purchasePrice"), maxValue);
      Predicate rentMax = cb.lessThanOrEqualTo(root.get("rentPrice"), maxValue);
      predicates.add(cb.or(purchaseMax, rentMax));
    }
  }

  private User requireCurrentUser() {
    User currentUser = getCurrentUserOrNull();
    if (currentUser == null) {
      throw new ResponseStatusException(UNAUTHORIZED, "Not Authenticated!");
    }
    return currentUser;
  }

  private User requireMarketplaceUser() {
    User currentUser = requireCurrentUser();
    if (currentUser.getRole() != UserRole.ROLE_MARKETPLACE_USER) {
      throw new ResponseStatusException(FORBIDDEN, "Marketplace access is only available for public users");
    }
    return currentUser;
  }

  private User getCurrentUserOrNull() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
      return null;
    }
    return userRepository.findByEmail(authentication.getName()).orElse(null);
  }

  private String displayUsername(User user) {
    if (hasText(user.getUsername())) {
      return user.getUsername();
    }
    if (hasText(user.getFullName())) {
      return user.getFullName();
    }
    String email = user.getEmail();
    if (email == null) {
      return "user-" + user.getId();
    }
    int separatorIndex = email.indexOf('@');
    return separatorIndex > 0 ? email.substring(0, separatorIndex) : email;
  }

  private PropertyType requireFrontType(String type) {
    PropertyType propertyType = parseFrontType(type);
    if (propertyType == null) {
      throw new ResponseStatusException(BAD_REQUEST, "Invalid post type");
    }
    return propertyType;
  }

  private PropertyType parseFrontType(String type) {
    if (!hasText(type)) {
      return null;
    }
    return switch (type.trim().toLowerCase(Locale.ROOT)) {
      case "buy" -> PropertyType.FOR_SALE;
      case "rent" -> PropertyType.FOR_RENT;
      default -> null;
    };
  }

  private String toFrontType(PropertyType type) {
    if (type == null) {
      return "buy";
    }
    return switch (type) {
      case FOR_RENT -> "rent";
      case BOTH, FOR_SALE -> "buy";
    };
  }

  private String normalizeCategory(String value) {
    return hasText(value) ? value.trim().toLowerCase(Locale.ROOT) : null;
  }

  private BigDecimal toCoordinate(String value, String fieldName) {
    try {
      return new BigDecimal(value.trim());
    } catch (Exception ex) {
      throw new ResponseStatusException(BAD_REQUEST, fieldName + " is invalid");
    }
  }

  private double parseCoordinate(String value, String fieldName) {
    try {
      return Double.parseDouble(value.trim());
    } catch (Exception ex) {
      throw new ResponseStatusException(BAD_REQUEST, fieldName + " is invalid");
    }
  }

  private BigDecimal toArea(Integer size) {
    return size == null ? BigDecimal.ZERO : BigDecimal.valueOf(size);
  }

  private BigDecimal toPrice(Long value) {
    if (value == null || value < 0) {
      throw new ResponseStatusException(BAD_REQUEST, "Price is invalid");
    }
    return BigDecimal.valueOf(value);
  }

  private Long toResponsePrice(Property property) {
    BigDecimal price = property.getType() == PropertyType.FOR_RENT ? property.getRentPrice() : property.getPurchasePrice();
    if (price == null) {
      price = property.getPurchasePrice() != null ? property.getPurchasePrice() : property.getRentPrice();
    }
    return price == null ? 0L : price.setScale(0, RoundingMode.HALF_UP).longValue();
  }

  private String normalizeEmail(String value) {
    return hasText(value) ? value.trim().toLowerCase(Locale.ROOT) : null;
  }

  private String normalizeUsername(String value) {
    return hasText(value) ? value.trim() : null;
  }

  private boolean hasText(String value) {
    return value != null && !value.trim().isEmpty();
  }

  private String blankToNull(String value) {
    return hasText(value) ? value.trim() : null;
  }

  private double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
    double earthRadius = 6371.0;
    double dLat = Math.toRadians(lat2 - lat1);
    double dLon = Math.toRadians(lon2 - lon1);
    double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
        * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  }
}
