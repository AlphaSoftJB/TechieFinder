# TechieFinder Postman Collection

A complete Postman collection covering every backend endpoint (61 requests
across 10 folders), verified request-by-request against the live backend.

## Files

- `TechieFinder.postman_collection.json` — the collection itself
- `TechieFinder.postman_environment.json` — a minimal environment (just
  `baseUrl`); the collection also ships its own collection-level variables
  with sensible local defaults, so importing the environment is optional

## Quick start

1. Start the backend locally: `cd backend && mvn spring-boot:run` (dev
   profile, in-memory H2, no setup needed). It listens on `:8080`.
2. In Postman: **Import** both JSON files in this folder.
3. Run **Auth → Register - Customer**, then **Auth → Register - Technician**.
   Each request's *Tests* script saves its token/id into collection
   variables automatically (`customerToken`, `technicianToken`, etc.) —
   nothing to copy/paste by hand.
4. Run **Technicians → Create Technician Profile**, then **Update My
   Location** and **Add My Service Offering** so the technician is bookable.
5. Walk through **Bookings → Payments → Ratings → Messaging** in order —
   each folder is ordered so requests chain correctly (a booking must exist
   before you can pay for it or rate it, etc.).
6. Run **Auth → Login - Seeded Admin** to get an admin token for the
   **Admin** folder. Default dev credentials are
   `admin@techiefinder.com` / `ChangeMe123!` (overridable via the
   `ADMIN_EMAIL`/`ADMIN_PASSWORD` environment variables — see
   `.env.example`).

You can also select the whole collection and use Postman's **Runner** to
execute a folder (or the whole thing) top-to-bottom in one click.

## Notes

- **File uploads** (`Upload Portfolio Photo`, `Upload Certification`) use
  `formdata` bodies — select an actual file for the `image`/`certificateFile`
  field before sending; Postman can't do that automatically.
- **Webhook requests** (`Paystack Webhook`, `Flutterwave Webhook`) are
  included for reference/shape only. They're meant to be called by the
  gateway itself and are signature-verified server-side — sending them
  as-is from Postman will get a 403 unless you compute a real signature.
- **Social sign-in requests** (`Sign In with Google`, `Sign In with Apple`)
  are also reference/shape only — the backend verifies the ID token's real
  signature against Google's/Apple's published JWKS, which Postman can't
  fabricate. Sending them as-is gets a 400 (not configured) or a signature
  error. `Refresh Token` (right above them) works normally, though, and is
  what the mobile app's biometric quick-unlock calls under the hood.
- **Payments** settle instantly against a wallet simulation unless
  `PAYMENT_GATEWAY_PROVIDER` names a real, configured gateway, in which case
  `Pay for Booking` instead returns `requiresRedirect: true` plus an
  `authorizationUrl` to open in a browser — see the root `DOCUMENTATION.md`
  for the full payment flow.
- Every request/response shape here was spot-checked against a running
  instance of the backend (register → create profile → location → service
  offering → booking → payment → recommended technicians) before this
  collection was committed.
