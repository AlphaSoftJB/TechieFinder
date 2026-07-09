package com.techiefinder.service.storage;

import com.techiefinder.exception.ValidationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

/**
 * Saves uploaded files under file.upload.dir/{subdirectory}, serving them
 * back out at /uploads/** (see WebMvcConfig). Local disk storage keeps this
 * simple for the current single-instance deployment; swap for S3/Cloud
 * Storage here if the app ever needs to scale to multiple instances.
 */
@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");
    private static final Set<String> ALLOWED_DOCUMENT_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "pdf");

    @Value("${file.upload.dir}")
    private String uploadDir;

    public String storeImage(MultipartFile file, String subdirectory) {
        return store(file, subdirectory, ALLOWED_IMAGE_EXTENSIONS);
    }

    public String storeDocument(MultipartFile file, String subdirectory) {
        return store(file, subdirectory, ALLOWED_DOCUMENT_EXTENSIONS);
    }

    private String store(MultipartFile file, String subdirectory, Set<String> allowedExtensions) {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("A file must be uploaded");
        }

        String original = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "");
        String extension = original.contains(".") ? original.substring(original.lastIndexOf('.') + 1).toLowerCase() : "";
        if (!allowedExtensions.contains(extension)) {
            throw new ValidationException("Unsupported file type. Allowed: " + String.join(", ", allowedExtensions));
        }

        try {
            Path targetDir = Paths.get(uploadDir, subdirectory).toAbsolutePath().normalize();
            Files.createDirectories(targetDir);

            String filename = UUID.randomUUID() + "." + extension;
            Path targetPath = targetDir.resolve(filename);
            file.transferTo(targetPath);

            return "/uploads/" + subdirectory + "/" + filename;
        } catch (IOException e) {
            throw new IllegalStateException("Could not store the uploaded file", e);
        }
    }

    /** Exposed for the delete flows so they can garbage-collect the file when a record is removed. */
    public void delete(String relativeUrl) {
        if (relativeUrl == null || !relativeUrl.startsWith("/uploads/")) {
            return;
        }
        try {
            Path path = Paths.get(uploadDir, relativeUrl.substring("/uploads/".length())).toAbsolutePath().normalize();
            Files.deleteIfExists(path);
        } catch (IOException e) {
            // Best-effort cleanup; an orphaned file on disk isn't worth failing the request over.
        }
    }

}
