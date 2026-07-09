package com.techiefinder.exception;

/**
 * For request-input problems that aren't bean-validation failures on a
 * @Valid request body (e.g. a manually-checked multipart file field) --
 * IllegalArgumentException is already used for "not found" (404) elsewhere in
 * this codebase, so it can't double as a 400 here without ambiguity.
 */
public class ValidationException extends RuntimeException {
    public ValidationException(String message) {
        super(message);
    }
}
