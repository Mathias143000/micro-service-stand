package com.example.realestate.property;

import com.example.realestate.common.FileStorageService;
import com.example.realestate.user.User;
import com.example.realestate.user.UserRepository;
import com.example.realestate.user.UserRole;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.http.HttpStatus.NOT_FOUND;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@RestController
@RequestMapping("/api")
public class PropertyPhotoController {

  private static final long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

  private final PropertyRepository propertyRepository;
  private final PropertyPhotoRepository photoRepository;
  private final FileStorageService fileStorageService;
  private final UserRepository userRepository;

  public PropertyPhotoController(
      PropertyRepository propertyRepository,
      PropertyPhotoRepository photoRepository,
      FileStorageService fileStorageService,
      UserRepository userRepository
  ) {
    this.propertyRepository = propertyRepository;
    this.photoRepository = photoRepository;
    this.fileStorageService = fileStorageService;
    this.userRepository = userRepository;
  }

  @PostMapping("/properties/{id}/images")
  public PropertyImageResponse uploadImage(
      @PathVariable("id") Long propertyId,
      @RequestParam("file") MultipartFile file,
      @RequestParam(value = "category", required = false) String category
  ) throws IOException {
    if (file.isEmpty()) {
      throw new ResponseStatusException(BAD_REQUEST, "File is empty");
    }
    if (file.getSize() > MAX_FILE_SIZE_BYTES) {
      throw new ResponseStatusException(BAD_REQUEST, "File too large (max 10 MB)");
    }
    String contentType = file.getContentType();
    if (contentType == null || !contentType.startsWith("image/")) {
      throw new ResponseStatusException(BAD_REQUEST, "Only image files are allowed");
    }

    Property property = propertyRepository.findById(propertyId)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Property not found"));

    authorizePhotoMutation(property);
    PropertyPhotoCategory photoCategory = normalizeCategory(category);

    String storedPath = fileStorageService.saveMultipart(file);

    PropertyPhoto photo = new PropertyPhoto();
    photo.setProperty(property);
    photo.setPath(storedPath);
    photo.setCategory(photoCategory);
    PropertyPhoto saved = photoRepository.save(photo);

    return new PropertyImageResponse(saved.getId(), "/api/images/" + saved.getId(), toResponseCategory(saved.getCategory()));
  }

  @GetMapping("/properties/{id}/images")
  public List<PropertyImageResponse> listImages(@PathVariable("id") Long propertyId) {
    propertyRepository.findById(propertyId)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Property not found"));

    return photoRepository.findByPropertyIdOrderByCreatedAtAsc(propertyId).stream()
        .map(p -> new PropertyImageResponse(
            p.getId(),
            isExternalUrl(p.getPath()) ? p.getPath() : "/api/images/" + p.getId(),
            toResponseCategory(p.getCategory())
        ))
        .collect(Collectors.toList());
  }

  @GetMapping("/images/{id}")
  public ResponseEntity<Resource> getImage(@PathVariable("id") Long imageId) throws IOException {
    PropertyPhoto photo = photoRepository.findById(imageId)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Image not found"));

    if (isExternalUrl(photo.getPath())) {
      return ResponseEntity.status(HttpStatus.FOUND)
          .header(HttpHeaders.LOCATION, photo.getPath())
          .body(null);
    }

    Path path = Paths.get(photo.getPath());
    if (!Files.exists(path)) {
      throw new ResponseStatusException(NOT_FOUND, "File not found on disk");
    }

    byte[] bytes = Files.readAllBytes(path);
    ByteArrayResource resource = new ByteArrayResource(bytes);
    String contentType = Files.probeContentType(path);
    if (contentType == null) {
      contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
    }

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.parseMediaType(contentType));

    return new ResponseEntity<>(resource, headers, HttpStatus.OK);
  }

  @DeleteMapping("/properties/images/{imageId}")
  public ResponseEntity<Void> deleteImage(@PathVariable("imageId") Long imageId) throws IOException {
    PropertyPhoto photo = photoRepository.findById(imageId)
        .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Image not found"));

    authorizePhotoMutation(photo.getProperty());

    if (!isExternalUrl(photo.getPath())) {
      Path path = Paths.get(photo.getPath());
      if (Files.exists(path)) {
        Files.delete(path);
      }
    }
    photoRepository.delete(photo);
    return ResponseEntity.noContent().build();
  }

  private void authorizePhotoMutation(Property property) {
    User currentUser = requireCurrentUser();

    if (currentUser.getRole() == UserRole.ROLE_ADMIN || currentUser.getRole() == UserRole.ROLE_REALTOR) {
      return;
    }

    if (currentUser.getRole() == UserRole.ROLE_MARKETPLACE_USER
        && property.getOwner() != null
        && property.getOwner().getId().equals(currentUser.getId())) {
      return;
    }

    throw new ResponseStatusException(FORBIDDEN, "Not authorized to manage listing photos");
  }

  private User requireCurrentUser() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
      throw new ResponseStatusException(UNAUTHORIZED, "Not authenticated");
    }

    return userRepository.findByEmail(authentication.getName())
        .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Not authenticated"));
  }

  private PropertyPhotoCategory normalizeCategory(String category) {
    if (category == null || category.isBlank()) {
      return PropertyPhotoCategory.EXTERIOR;
    }

    return switch (category.trim().toLowerCase(Locale.ROOT)) {
      case "exterior", "facade" -> PropertyPhotoCategory.EXTERIOR;
      case "interior", "inside" -> PropertyPhotoCategory.INTERIOR;
      case "floorplan", "floor_plan", "plan" -> PropertyPhotoCategory.FLOOR_PLAN;
      default -> throw new ResponseStatusException(BAD_REQUEST, "Unsupported image category");
    };
  }

  private String toResponseCategory(PropertyPhotoCategory category) {
    if (category == null) {
      return "exterior";
    }

    return switch (category) {
      case EXTERIOR -> "exterior";
      case INTERIOR -> "interior";
      case FLOOR_PLAN -> "floorplan";
    };
  }

  private boolean isExternalUrl(String value) {
    return value != null && (value.startsWith("http://") || value.startsWith("https://"));
  }
}
