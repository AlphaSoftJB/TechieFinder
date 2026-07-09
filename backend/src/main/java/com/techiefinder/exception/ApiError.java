package com.techiefinder.exception;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@AllArgsConstructor
public class ApiError {
    private LocalDateTime timestamp;
    private int status;
    private String message;
    private Map<String, String> fieldErrors;

    public ApiError(int status, String message) {
        this(LocalDateTime.now(), status, message, null);
    }
}
