# AGENT 3 — INTEGRATION ENGINEER

Role:
Integration Engineer responsible for the core WhatsApp messaging infrastructure, session management, and reliable message delivery.

Scope:
This agent owns the "Worker" and "WhatsApp Service" logic. It handles the raw `Baileys` socket connections, manages authentication state in Redis, and consumes message jobs from the queue.

Tech Stack:
- **Core**: Node.js, TypeScript
- **Library**: @whiskeysockets/baileys
- **Queue System**: BullMQ (Worker for sending messages)
- **State Management**: Redis (Auth state, QR code streaming)
- **Logging**: Pino (Structured logs for debugging)

Responsibilities:

1.  **WhatsApp Session Management** (Multi-Tenancy)
    -   Implement a custom `AuthState` using Redis to store session credentials.
    -   Support dynamic creation/destruction of sessions based on `userId`.
    -   Maintain a `Map<UserId, WASocket>` in memory for active connections.
    -   Handle connection lifecycle events: `open`, `connecting`, `close`.
    -   Implement aggressive but safe reconnection logic (Exponential Backoff).

2.  **QR Code Streaming**
    -   When a session is requested via API (Agent 2), initialize the socket.
    -   Listen for `connection.update` events containing the QR code.
    -   Publish the QR string to a Redis Pub/Sub channel (e.g., `whatsapp:qr:{userId}`) so the API can forward it to the client via SSE/WebSocket.

3.  **Message Delivery Worker**
    -   Implement a BullMQ Worker to consume the `otp-delivery` queue.
    -   **Process**:
        1.  Extract `userId`, `phone`, `otp` from the job.
        2.  Retrieve the active Baileys socket for the `userId`.
        3.  If the socket is disconnected/missing, attempt to restore the session from Redis.
        4.  Send the message using `sock.sendMessage`.
        5.  Update job progress and return success/failure.

4.  **Event Handling & Status Updates**
    -   Listen for `messages.upsert` (optional, for auto-replies).
    -   Listen for `message-receipt.update` (delivery reports) and update the message status in the database (via Agent 2 or direct DB write).

Deliverables:

-   `src/services/whatsapp/SessionStore.ts`: Redis-backed auth state implementation.
-   `src/services/whatsapp/ClientManager.ts`: Class to manage multiple socket instances.
-   `src/workers/OtpWorker.ts`: The background processor for sending messages.
-   `src/utils/PhoneNumber.ts`: Helper to format numbers (append country code if missing).

Failure Handling:
-   **Auth Failure**: If `DisconnectReason.loggedOut` occurs, delete session data from Redis and mark the user as 'disconnected' in DB.
-   **Network Flake**: Retry message sending 3 times with exponential backoff.
-   **Stream Issues**: Detect "Stream Stream" errors and restart the socket automatically.

Definition of Done:
-   Reliable scanning of QR code (propagated to frontend).
-   Session persists across app restarts (data in Redis).
-   "Send OTP" job results in a message on the user's phone.
-   Graceful handling of "Phone Offline" scenarios.