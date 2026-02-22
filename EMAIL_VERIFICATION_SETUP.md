# Email Verification Setup Guide

## ✅ Implementation Complete!

The email verification system has been successfully implemented for ReserveCut.

---

## 📧 Email Configuration Required

Before testing, you need to configure email settings in `application.properties`:

### For Gmail:

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password:
   - Go to Security → 2-Step Verification → App Passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password

4. Update `backend/src/main/resources/application.properties`:

```properties
spring.mail.username=your-gmail@gmail.com
spring.mail.password=your-16-char-app-password
```

### Alternative: Use a test SMTP service like Mailtrap

```properties
spring.mail.host=smtp.mailtrap.io
spring.mail.port=2525
spring.mail.username=your-mailtrap-username
spring.mail.password=your-mailtrap-password
```

---

## 🔄 Registration Flow

1. **User registers** → Account created with `emailVerified = false`
2. **6-digit code generated** → Sent to user's email
3. **Code expires in 10 minutes**
4. **User enters code** → Account becomes verified
5. **User can login** → Only if email is verified

---

## 🎯 Features Implemented

### Backend (Spring Boot)

✅ User entity updated with verification fields
✅ Email service created (JavaMailSender)
✅ Verification code generation (6-digit)
✅ POST `/api/users/verify-email` endpoint
✅ POST `/api/users/resend-code` endpoint
✅ Login blocked for unverified users
✅ spring-boot-starter-mail dependency added

### Frontend (React)

✅ VerifyEmail page created
✅ Timer countdown (10 minutes)
✅ 6-digit code input
✅ Resend code button
✅ Auto-redirect after verification
✅ Error handling for expired codes
✅ Register page redirects to verification
✅ Login page handles unverified accounts

---

## 🚀 Testing the System

### 1. Start Backend

```bash
cd backend
./mvnw spring-boot:run
```

### 2. Start Frontend

```bash
cd frontend
npm start
```

### 3. Register a New User

- Go to `/register`
- Fill in the form
- Submit
- You'll be redirected to `/verify-email`

### 4. Check Email

- Check your email inbox
- Find the 6-digit code
- Copy it

### 5. Verify Email

- Paste the code in the verification page
- Click "Verify"
- Success! You can now login

### 6. Try Login Before Verification

- Try logging in before verifying
- You'll see: "Please verify your email first"
- Auto-redirect to verification page

---

## 🗄️ Database Changes

New columns added to `users` table:

- `email_verified` (BOOLEAN, default: false)
- `verification_code` (VARCHAR, nullable)
- `verification_code_expiry` (DATETIME, nullable)

JPA will auto-create these columns on next startup.

---

## 📝 API Endpoints

### Register User

```
POST /api/users/register
Body: { name, email, phone, password, role }
Response: User created + verification email sent
```

### Verify Email

```
POST /api/users/verify-email
Body: { email, verificationCode }
Response: "Email verified successfully!"
```

### Resend Code

```
POST /api/users/resend-code
Body: { email }
Response: "Verification code sent successfully!"
```

### Login

```
POST /api/users/login
Body: { email, password }
Response: JWT token (only if email verified)
Error: "Please verify your email first" (403)
```

---

## 🎨 UI Features

- Modern 6-digit input box
- Real-time countdown timer
- Smooth animations
- Mobile responsive
- Clear error messages
- Loading states
- Auto-focus on code input

---

## 🔒 Security Features

- Code expires after 10 minutes
- One-time use codes
- Codes cleared after successful verification
- Login blocked until verified
- Secure password hashing
- JWT authentication

---

## 📧 Email Template

Current email format:

```
Subject: Verify Your ReserveCut Account

Welcome to ReserveCut!

Your verification code is: 123456

This code will expire in 10 minutes.

If you didn't request this verification, please ignore this email.

Best regards,
The ReserveCut Team
```

---

## 🎯 Next Steps (Optional Enhancements)

1. **HTML Email Templates** - Add styled HTML emails
2. **Rate Limiting** - Limit verification attempts
3. **Auto-cleanup** - Delete unverified accounts after 24h
4. **Password Reset** - Add forgot password flow
5. **Email Change** - Allow users to update email with verification

---

## 🐛 Troubleshooting

### Email not sending

- Check Gmail App Password is correct
- Verify SMTP settings in application.properties
- Check spam folder
- Try Mailtrap for testing

### Code always invalid

- Check system clock is synchronized
- Verify expiry time is set correctly
- Check database timezone settings

### Login still works without verification (during testing)

- Clear database
- Restart backend
- Re-register user

---

## ✨ System Ready!

The email verification system is production-ready. Just configure your email settings and you're good to go!
