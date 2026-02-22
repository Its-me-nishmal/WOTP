# System Architecture

WOTP is designed for high reliability and scalability using a modern tech stack.

## 🏗 High-Level Overview

The system consists of three main parts:
1. **Frontend**: A React + Vite dashboard for users to manage keys, view logs, and monitor statistics.
2. **Backend**: An Express.js server that handles API requests, authentication, and database interactions.
3. **Queue System**: A Redis-backed BullMQ system that handles the asynchronous delivery of WhatsApp messages.

---

## 🛠 Technology Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Frontend**: React, Tailwind CSS, Zustand (State Management)
- **Database**: MongoDB (User data, logs, API keys)
- **Queue/Cache**: Redis (BullMQ for background jobs)
- **WhatsApp Integration**: [Baileys](https://github.com/adiwajshing/Baileys) - A TypeScript/JavaScript WhatsApp Web API.

---

## 🔄 OTP Workflow

1. **Request**: A developer sends a `POST /api/otp/send` request with an API Key.
2. **Validation**: The backend validates the API Key, checks the user's plan quota, and ensures the phone number is valid.
3. **Storage**: A random 6-digit OTP is generated, hashed, and stored in MongoDB with an expiration time (default 5 minutes).
4. **Queueing**: A job is added to the `otp-queue` in Redis.
5. **Delivery**: A background worker picks up the job, retrieves the active WhatsApp session for the user, and sends the message via Baileys.
6. **Logging**: The status of the delivery (sent/failed) is logged in the `OtpLog` collection.
7. **Verification**: When the user provides the OTP, the developer calls `POST /api/otp/verify`. The backend compares the provided OTP with the hashed version in the database.

---

## 🛡 Security Measures

- **API Key Hashing**: API keys are hashed (SHA-256) before storage. We only store the hash, similar to how passwords are handled.
- **Rate Limiting**: `express-rate-limit` is used on public endpoints to prevent brute-force and DDoS attacks.
- **OTP Hashing**: Like passwords, OTP values are hashed in the database to prevent exposure in case of a data breach.
- **JWT Authentication**: The dashboard uses JWT (JSON Web Tokens) with short-lived access tokens and refresh tokens for secure session management.
