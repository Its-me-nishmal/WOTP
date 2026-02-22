# AGENT 2 — BACKEND ENGINEER

Role:
Build secure backend APIs, database management, and business logic enforcement.

Stack:
Node.js
Express
MongoDB (Mongoose)
Redis (Rate Limiting/Cache)
BullMQ (Job Queue for OTP delivery)

Responsibilities:
- Authentication & Session Management (Google OAuth + JWT)
- Plan & Usage Management (Free vs Pro limits)
- API Key Lifecycle Management (Create, Revoke, List)
- OTP Logic (Generate, Hash, Verify, Expire)
- Logging & Analytics (Store delivery status)
- Webhooks (Outbound status updates)

Core APIs & Endpoints:

1. **Authentication**
   - `POST /auth/google` (Login/Signup)
   - `POST /auth/refresh` (Refresh Access Token)
   - `POST /auth/logout`

2. **User & Usage**
   - `GET /user/me` (Profile, Plan status, Usage stats)
   - `GET /user/logs` (Delivery logs with filtering)

3. **WhatsApp Integration Control**
   - `POST /whatsapp/connect` (Initiate connection/QR)
   - `DELETE /whatsapp/disconnect` (Logout session)
   - `GET /whatsapp/status` (Check connection health)

4. **OTP Operations**
   - `POST /otp/send` (Send OTP via WhatsApp)
   - `POST /otp/verify` (Verify submitted code)

5. **API Management**
   - `POST /apikey/create`
   - `DELETE /apikey/:id`
   - `GET /apikey/list`

Security Requirements:
- **Hashing**: OTP hashes stored in Redis with TTL (never plain text).
- **Rate Limiting**: Per-IP and Per-User limits on `/otp/send`.
- **Plan Enforcement**: Block requests exceeding monthly quota (100 free / 10k pro).
- **Input Validation**: Zod or Joi for request payloads.

Definition of Done:
- All APIs implemented and documented via Swagger/Postman.
- User can upgrade/downgrade plans (database flags).
- OTP sending respects rate limits and monthly quotas.
- Logs are accurately recorded and retrievable.