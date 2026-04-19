package com.example.realestate.common;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {
  private final Path storageDir;

  public FileStorageService(@Value("${app.files.storage-dir}") String storageDir) throws IOException {
    this.storageDir = Paths.get(storageDir);
    Files.createDirectories(this.storageDir);
  }

  public String saveBytes(byte[] bytes, String filename) throws IOException {
    String safeName = UUID.randomUUID() + "-" + filename;
    Path target = storageDir.resolve(safeName);
    Files.write(target, bytes);
    return target.toString();
  }

  public String saveMultipart(MultipartFile file) throws IOException {
    String safeName = UUID.randomUUID() + "-" + file.getOriginalFilename();
    Path target = storageDir.resolve(safeName);
    Files.copy(file.getInputStream(), target);
    return target.toString();
  }
}
