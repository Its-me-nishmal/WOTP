# Project Setup Guide

Follow these steps to set up the WOTP platform locally on your machine.

## 📋 Prerequisites

Ensure you have the following installed:
- **Node.js** (v18 or higher)
- **MongoDB** (Local instance or Atlas)
- **Redis** (Required for the OTP job queue)
- **npm** or **yarn**

---

## 🛠 Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Update the following variables in `.env`:
   - `MONGO_URI`: Your MongoDB connection string.
   - `REDIS_URL`: Your Redis connection string.
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: For Google Authentication (optional for local dev if using **Dev Login**).

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The backend will start on `http://localhost:5000`.

---

## 💻 Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The frontend will start on `http://localhost:5173`.

---

## 🧪 Testing the Setup

1. Open `http://localhost:5173` in your browser.
2. Click on **"Dev Login (No Credentials)"** to bypass Google Auth.
3. Once in the dashboard:
   - Go to the **WhatsApp** section and connect your device (scan QR).
   - Go to the **API Keys** section and create a new key.
   - Use the **Dashboard Tester** or `curl` to send a test OTP.

---

## 🕒 Troubleshooting

- **Redis Connection Error:** Ensure your Redis server is running. WOTP uses BullMQ for background processing, which depends on Redis.
- **WhatsApp Qr Not Loading:** Check the backend logs. Ensure the `baileys` service is initializing correctly.
- **CORS Errors:** Ensure the `FRONTEND_URL` in the backend `.env` matches your frontend's address.
