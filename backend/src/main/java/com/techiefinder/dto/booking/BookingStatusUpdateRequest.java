package com.techiefinder.dto.booking;

import com.techiefinder.model.booking.Booking;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookingStatusUpdateRequest {
    @NotNull
    private Booking.BookingStatus status;

    private String reason;
}
