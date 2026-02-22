# WOTP API Reference

This guide explains how to integrate WOTP into your application to send and verify One-Time Passwords via WhatsApp.

## 🔐 Authentication

All API requests require an **API Key**. You can generate one from the WOTP Dashboard.

Include your API key in the `Authorization` header of every request:

```http
Authorization: Bearer YOUR_API_KEY
```

---

## 📲 Send OTP

Send a 6-digit OTP to a specific phone number.

- **Endpoint:** `POST /api/otp/send`
- **Content-Type:** `application/json`

### Request Body
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `phone` | `string` | Yes | Phone number in international format (e.g., `+919876543210`) |
| `length` | `number` | No | Character length of OTP (4-12, default: 6) |
| `type` | `string` | No | `numeric`, `alphanumeric`, or `alpha` (default: `numeric`) |
| `expiresIn` | `number` | No | Expiry time in seconds (30-3600, default: 300) |
| `message` | `string` | No | Custom message template. Use `{{otp}}` as a placeholder (e.g., "Your code is {{otp}}"). |

### Example Request
```bash
curl -X POST http://localhost:5000/api/otp/send \
  -H "Authorization: Bearer wk_..." \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "length": 8,
    "type": "alphanumeric",
    "expiresIn": 600,
    "message": "Welcome to Our App! Your secure code is {{otp}}. Valid for 10 mins."
  }'
```

### Response (200 OK)
```json
{
  "success": true,
  "message": "OTP sent",
  "phone": "+919876543210"
}
```

### Error Response (400 Bad Request)
```json
{
  "error": "Invalid phone number format"
}
```

---

## ✅ Verify OTP

Verify an OTP that was previously sent to a phone number.

- **Endpoint:** `POST /api/otp/verify`
- **Content-Type:** `application/json`

### Request Body
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `phone` | `string` | Yes | Phone number in international format |
| `otp` | `string` | Yes | The OTP received by the user |

### Example Request
```bash
curl -X POST http://localhost:5000/api/otp/verify \
  -H "Authorization: Bearer wk_..." \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+919876543210",
    "otp": "123456"
  }'
```

### Response (200 OK - Success)
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

### Response (200 OK - Failure / Expired)
```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

---

## 🛠 Status Codes & Errors

Our API uses standard HTTP response codes to indicate the success or failure of an API request.

| Status Code | Description |
| :--- | :--- |
| `200 OK` | The request was successful. |
| `400 Bad Request` | Invalid parameters, missing fields, or validation error. |
| `401 Unauthorized` | Invalid or missing API Key in Authorization header. |
| `403 Forbidden` | WhatsApp service is disconnected or account is restricted. |
| `429 Too Many Requests` | Rate limit exceeded (5 requests/min) or daily quota reached. |
| `500 Internal Error` | Something went wrong on our server. |

### Error Response Format
All errors follow a consistent JSON structure:
```json
{
  "error": "Short descriptive error message",
  "details": "Technical details (optional)"
}
```

---

## ⏳ Rate Limits & Quotas
To ensure platform stability, the following limits apply:
- **Rate Limit**: 5 OTP requests per minute per IP/Key.
- **Trial Quota**: 100 OTPs per month (Free Tier).
- **Pro Quota**: 10,000 OTPs per month.
