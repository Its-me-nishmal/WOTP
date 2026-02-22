# WOTP - WhatsApp OTP Platform

This is a developer-focused platform for sending One-Time Passwords via WhatsApp.

## 🚀 Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```
Runs on http://localhost:5000

The backend includes a **Dev Login** feature (`/api/auth/dev-login`) that bypasses Google OAuth for local development.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5173

Visit the frontend and click **"Dev Login (No Credentials)"** to enter the dashboard immediately.

## 📚 Documentation

For more detailed information, check our documentation section:
- [**Full Setup Guide**](./docs/setup.md)
- [**API Reference**](./docs/api-reference.md)
- [**System Architecture**](./docs/architecture.md)

---

## 🏗 Architecture
- **Backend**: Node.js, Express, MongoDB, Redis, BullMQ
- **Frontend**: React, TypeScript, Tailwind, Zustand, Axios
- **Auth**: Google OAuth (Prod) / Dev Login (Local)
- **WhatsApp**: Baileys (via Agent 3 integration)

## 🔑 Environment Variables
Copy `.env.example` to `.env` in `backend/` and configure if needed.
For local dev, defaults work fine (assuming local MongoDB/Redis).
