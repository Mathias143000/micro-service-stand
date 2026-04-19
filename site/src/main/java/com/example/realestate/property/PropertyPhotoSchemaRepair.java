package com.example.realestate.property;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PropertyPhotoSchemaRepair implements ApplicationRunner {

  private final JdbcTemplate jdbcTemplate;

  @Override
  public void run(ApplicationArguments args) {
    jdbcTemplate.execute("ALTER TABLE IF EXISTS property_photos ADD COLUMN IF NOT EXISTS category VARCHAR(32)");
    jdbcTemplate.execute("UPDATE property_photos SET category = 'EXTERIOR' WHERE category IS NULL");
    jdbcTemplate.execute("ALTER TABLE IF EXISTS property_photos ALTER COLUMN category SET DEFAULT 'EXTERIOR'");

    jdbcTemplate.execute("ALTER TABLE IF EXISTS favorites ADD COLUMN IF NOT EXISTS saved_price NUMERIC(19,2)");
    jdbcTemplate.execute("ALTER TABLE IF EXISTS favorites ADD COLUMN IF NOT EXISTS price_alert_enabled BOOLEAN");
    jdbcTemplate.execute("UPDATE favorites SET price_alert_enabled = TRUE WHERE price_alert_enabled IS NULL");
    jdbcTemplate.execute("ALTER TABLE IF EXISTS favorites ALTER COLUMN price_alert_enabled SET DEFAULT TRUE");

    log.info("Ensured marketplace legacy columns exist for property photos and favorites");
  }
}