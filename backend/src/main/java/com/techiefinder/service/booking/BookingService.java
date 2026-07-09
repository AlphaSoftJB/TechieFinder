package com.techiefinder.service.booking;

import com.techiefinder.dto.booking.BookingDto;
import com.techiefinder.dto.booking.BookingRequest;
import com.techiefinder.dto.booking.BookingStatusUpdateRequest;
import com.techiefinder.model.booking.Booking;
import com.techiefinder.model.notification.Notification;
import com.techiefinder.model.technician.Technician;
import com.techiefinder.model.user.User;
import com.techiefinder.repository.booking.BookingRepository;
import com.techiefinder.repository.technician.TechnicianRepository;
import com.techiefinder.repository.user.UserRepository;
import com.techiefinder.service.notification.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BookingService {

    private static final Set<Booking.BookingStatus> TECHNICIAN_ONLY_TRANSITIONS = Set.of(
            Booking.BookingStatus.CONFIRMED,
            Booking.BookingStatus.REJECTED,
            Booking.BookingStatus.IN_PROGRESS,
            Booking.BookingStatus.COMPLETED
    );

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TechnicianRepository technicianRepository;

    @Autowired
    private NotificationService notificationService;

    @Transactional
    public BookingDto createBooking(Long userId, BookingRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Technician technician = technicianRepository.findById(request.getTechnicianId())
                .orElseThrow(() -> new IllegalArgumentException("Technician not found"));

        if (!Boolean.TRUE.equals(technician.getAvailable()) || !Boolean.TRUE.equals(technician.getAcceptingJobs())) {
            throw new IllegalStateException("Technician is not currently accepting jobs");
        }

        Booking booking = Booking.builder()
                .bookingNumber(generateBookingNumber())
                .user(user)
                .technician(technician)
                .status(Booking.BookingStatus.PENDING)
                .scheduledDateTime(request.getScheduledDateTime())
                .serviceDescription(request.getServiceDescription())
                .userNotes(request.getUserNotes())
                .serviceAddress(request.getServiceAddress())
                .city(request.getCity())
                .state(request.getState())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .estimatedPrice(request.getEstimatedPrice())
                .paymentStatus(Booking.PaymentStatus.PENDING)
                .build();

        booking = bookingRepository.save(booking);

        notificationService.notify(technician.getUser(), Notification.NotificationType.BOOKING_CREATED,
                "New booking request",
                "You have a new booking request: " + booking.getServiceDescription(),
                "/bookings/" + booking.getId());

        return mapToDto(booking);
    }

    public BookingDto getBookingById(Long id, Long requestingUserId) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));
        assertParticipant(booking, requestingUserId);
        return mapToDto(booking);
    }

    public List<BookingDto> getMyBookings(Long userId) {
        return bookingRepository.findByUserId(userId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<BookingDto> getMyTechnicianBookings(Long userId) {
        Technician technician = technicianRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("This account has no technician profile"));
        return bookingRepository.findByTechnicianId(technician.getId())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<BookingDto> getAllBookings() {
        return bookingRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingDto updateStatus(Long bookingId, Long actingUserId, BookingStatusUpdateRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        boolean isTechnician = booking.getTechnician().getUser().getId().equals(actingUserId);
        boolean isCustomer = booking.getUser().getId().equals(actingUserId);

        if (!isTechnician && !isCustomer) {
            throw new SecurityException("This booking does not belong to you");
        }

        Booking.BookingStatus newStatus = request.getStatus();

        if (TECHNICIAN_ONLY_TRANSITIONS.contains(newStatus) && !isTechnician) {
            throw new SecurityException("Only the assigned technician can set this status");
        }

        booking.setStatus(newStatus);

        if (newStatus == Booking.BookingStatus.COMPLETED) {
            booking.setCompletedDateTime(LocalDateTime.now());
            Technician technician = booking.getTechnician();
            technician.setCompletedJobs(technician.getCompletedJobs() + 1);
            technicianRepository.save(technician);
        } else if (newStatus == Booking.BookingStatus.CANCELLED) {
            booking.setCancelledAt(LocalDateTime.now());
            booking.setCancellationReason(request.getReason());
            booking.setCancelledBy(userRepository.findById(actingUserId).orElse(null));
            if (isTechnician) {
                Technician technician = booking.getTechnician();
                technician.setCancelledJobs(technician.getCancelledJobs() + 1);
                technicianRepository.save(technician);
            }
        }

        booking = bookingRepository.save(booking);

        User notifyTarget = isTechnician ? booking.getUser() : booking.getTechnician().getUser();
        Notification.NotificationType notificationType = switch (newStatus) {
            case CONFIRMED -> Notification.NotificationType.BOOKING_CONFIRMED;
            case CANCELLED, REJECTED -> Notification.NotificationType.BOOKING_CANCELLED;
            case COMPLETED -> Notification.NotificationType.BOOKING_COMPLETED;
            default -> Notification.NotificationType.BOOKING_CONFIRMED;
        };
        notificationService.notify(notifyTarget, notificationType,
                "Booking " + newStatus.name().toLowerCase(),
                "Booking #" + booking.getBookingNumber() + " is now " + newStatus.name().toLowerCase(),
                "/bookings/" + booking.getId());

        return mapToDto(booking);
    }

    private void assertParticipant(Booking booking, Long userId) {
        boolean isTechnician = booking.getTechnician().getUser().getId().equals(userId);
        boolean isCustomer = booking.getUser().getId().equals(userId);
        if (!isTechnician && !isCustomer) {
            throw new SecurityException("This booking does not belong to you");
        }
    }

    private String generateBookingNumber() {
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randomPart = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        return "BK-" + datePart + "-" + randomPart;
    }

    private BookingDto mapToDto(Booking booking) {
        BookingDto dto = new BookingDto();
        dto.setId(booking.getId());
        dto.setBookingNumber(booking.getBookingNumber());
        dto.setUserId(booking.getUser().getId());
        dto.setTechnicianId(booking.getTechnician().getId());
        dto.setCustomerName(booking.getUser().getFirstName() + " " + booking.getUser().getLastName());
        dto.setTechnicianName(booking.getTechnician().getUser().getFirstName() + " " + booking.getTechnician().getUser().getLastName());
        dto.setStatus(booking.getStatus().name());
        dto.setScheduledDateTime(booking.getScheduledDateTime());
        dto.setServiceDescription(booking.getServiceDescription());
        dto.setServiceAddress(booking.getServiceAddress());
        dto.setEstimatedPrice(booking.getEstimatedPrice());
        dto.setFinalPrice(booking.getFinalPrice());
        dto.setPaymentStatus(booking.getPaymentStatus().name());
        return dto;
    }
}
