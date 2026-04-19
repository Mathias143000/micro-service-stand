package com.example.realestate.common;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class GlobalExceptionHandler {

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<ApiError> handle(ResponseStatusException ex, HttpServletRequest request) {
    HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
    if (status == null) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
    }
    return ResponseEntity.status(status).body(toError(status, ex.getReason(), request));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiError> handle(MethodArgumentNotValidException ex, HttpServletRequest request) {
    HttpStatus status = HttpStatus.BAD_REQUEST;
    String message = ex.getBindingResult().getFieldErrors().stream()
        .findFirst()
        .map(err -> err.getField() + ": " + err.getDefaultMessage())
        .orElse("Validation failed");
    return ResponseEntity.status(status).body(toError(status, message, request));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiError> handle(Exception ex, HttpServletRequest request) {
    log.error("Unhandled error", ex);
    HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
    return ResponseEntity.status(status).body(toError(status, ex.getMessage(), request));
  }

  private ApiError toError(HttpStatus status, String message, HttpServletRequest request) {
    String resolvedMessage = (message == null || message.isBlank()) ? status.getReasonPhrase() : message;
    return new ApiError(
        Instant.now(),
        status.value(),
        status.getReasonPhrase(),
        resolvedMessage,
        request.getRequestURI()
    );
  }
}

