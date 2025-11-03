# VoltStream Email System

## Overview
Professional HTML email templates with VoltStream branding for all authentication flows.

## Email Types

### 1. Email Verification OTP
**Triggered:** After user signs up  
**From:** `VoltStream <noreply@voltstream.space>`  
**Subject:** "Verify Your Email - VoltStream"  
**Content:**
- VoltStream branded header with gradient (purple to pink)
- Welcome message
- Large, easy-to-read 6-digit OTP code
- Security notice
- 10-minute expiration warning

### 2. Sign In OTP
**Triggered:** User requests passwordless sign-in  
**From:** `VoltStream <noreply@voltstream.space>`  
**Subject:** "Sign In to VoltStream"  
**Content:**
- VoltStream branded header
- Sign-in message
- 6-digit OTP code
- Security notice
- 10-minute expiration

### 3. Password Reset OTP
**Triggered:** User requests password reset  
**From:** `VoltStream <noreply@voltstream.space>`  
**Subject:** "Reset Your Password - VoltStream"  
**Content:**
- VoltStream branded header
- Password reset instructions
- 6-digit OTP code
- Security warning
- 10-minute expiration

## Design Features

### Branding
- **Colors:** Purple (#8338EC) and Pink (#FF006E) gradient
- **Dark Theme:** Matches VoltStream's dark UI (#0A0A0A background)
- **Logo:** "VoltStream" text with "LIVE STREAMING PLATFORM" tagline

### Layout
- **Responsive:** Works on all devices
- **Max Width:** 600px for optimal readability
- **Dark Mode Friendly:** Uses dark backgrounds with light text
- **Accessible:** Proper semantic HTML structure

### Security Elements
- 🔒 Security notice prominently displayed
- Warning against sharing codes
- Clear expiration time (10 minutes)
- "If you didn't request this" message

### OTP Display
- **Large font:** 48px for easy reading
- **Monospace font:** Clear digit separation
- **Letter spacing:** 8px for better visibility
- **Pink color:** (#FF006E) stands out against dark background
- **Bordered box:** Purple border (#8338EC) with dark background

## Email Configuration

```typescript
// From: backend/src/lib/auth.ts
{
  from: "VoltStream <noreply@voltstream.space>",
  to: email,
  subject: "...",
  html: getEmailContent(otp, type)
}
```

### Settings
- **OTP Length:** 6 digits
- **Expiration:** 10 minutes (600 seconds)
- **Max Attempts:** 3 attempts before code invalidation
- **Service:** Resend API

## Domain Configuration

**Sending Domain:** `noreply@voltstream.space`

### Resend Setup Requirements
1. Add `voltstream.space` domain to Resend
2. Verify DNS records (SPF, DKIM, DMARC)
3. Wait for domain verification
4. Update `RESEND_API_KEY` in `.env`

## Template Files

- **Main Configuration:** `/backend/src/lib/auth.ts`
- **Reusable Templates:** `/backend/src/lib/email-templates.ts`

## Testing

### Test OTP Email Locally
```bash
# Send verification OTP
curl -X POST http://localhost:3000/api/auth/send-verification-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","type":"email-verification"}'

# Send sign-in OTP
curl -X POST http://localhost:3000/api/auth/send-verification-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","type":"sign-in"}'

# Send password reset OTP
curl -X POST http://localhost:3000/api/auth/send-verification-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","type":"forget-password"}'
```

## Email Preview

The emails render beautifully with:
- ✅ Dark theme matching VoltStream brand
- ✅ Gradient header (purple to pink)
- ✅ Large, readable OTP code
- ✅ Professional footer
- ✅ Security notices
- ✅ Mobile responsive design

## Future Enhancements

### Welcome Email (Template Ready)
A welcome email template is available in `/backend/src/lib/email-templates.ts`:
- Welcomes new users
- Showcases platform features
- Call-to-action buttons
- Social media links

To use, import `getWelcomeEmailTemplate` and send after successful verification.

### Other Potential Emails
- Creator application status updates
- New follower notifications
- Stream going live alerts
- Monthly activity summaries
- Feature announcements

## Troubleshooting

### Emails not sending?
1. Check `RESEND_API_KEY` in `.env`
2. Verify domain is verified in Resend dashboard
3. Check logs for Resend API errors
4. Ensure `noreply@voltstream.space` is configured

### OTP not received?
1. Check spam folder
2. Verify email address is valid
3. Check Resend logs for delivery status
4. Ensure within rate limits (3 attempts)

### Template looks broken?
1. Most email clients support the inline styles used
2. Test in multiple clients (Gmail, Outlook, Apple Mail)
3. Use email testing tools (Litmus, Email on Acid)

## Environment Variables

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
FRONTEND_URL=https://voltstream.space
BETTER_AUTH_URL=https://voltstreambackend.space
```

## Related Documentation
- Better Auth: https://www.better-auth.com/docs/plugins/email-otp
- Resend: https://resend.com/docs
