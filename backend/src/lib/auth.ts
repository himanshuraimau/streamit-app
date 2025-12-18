import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP, bearer } from "better-auth/plugins";
import { prisma } from "./db";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
  },

  // Base path for auth routes (default is /api/auth)
  basePath: "/api/auth",
  
  // Base URL of the auth server
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  
  // Secret for encryption
  secret: process.env.BETTER_AUTH_SECRET,

  trustedOrigins: [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "http://localhost:5173",
    "https://voltstream.space", // Production frontend
    "https://www.voltstream.space", // Production frontend with www
    "https://binate-nonperceptively-celestina.ngrok-free.dev", // ngrok tunnel
  ],

  // Advanced session configuration for cross-domain
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // Advanced cookie configuration for cross-domain
  advanced: {
    cookiePrefix: "better-auth",
    crossSubDomainCookies: {
      enabled: false, // Set to false since you have different domains
    },
    // Use secure cookies in production
    useSecureCookies: process.env.NODE_ENV === "production",
    
    // CRITICAL: Cookie attributes for cross-domain setup
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production", // Required with SameSite=none
      httpOnly: true,
      ...(process.env.NODE_ENV === "production" ? { partitioned: true } : {}),
    },
  },

  user: {
    additionalFields: {
      age: {
        type: "number",
        required: false,
      },
      phone: {
        type: "string",
        required: false,
      },
      username: {
        type: "string",
        required: true,
        unique: true,
      },
    },
  },





  plugins: [
    // Bearer token plugin for Safari and cross-domain compatibility
    bearer(),
    emailOTP({
      overrideDefaultEmailVerification: true,
      sendVerificationOnSignUp: true, // triggers OTP after signup
      async sendVerificationOTP({ email, otp, type }) {
        try {
          const getEmailContent = (otp: string, type: string) => {
          const title = 
            type === "email-verification" 
              ? "Verify Your Email" 
              : type === "sign-in" 
                ? "Sign In to VoltStream" 
                : "Reset Your Password";
          
          const message = 
            type === "email-verification"
              ? "Welcome to VoltStream! Please verify your email address to complete your registration and start streaming."
              : type === "sign-in"
                ? "You've requested to sign in to your VoltStream account. Use the code below to continue."
                : "You've requested to reset your password. Use the code below to proceed with resetting your password.";

          return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <body style='background-color:#0A0A0A;font-family:ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";padding-top:40px;padding-bottom:40px'>
    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin-left:auto;margin-right:auto;background-color:rgb(21,21,22);border-radius:16px;overflow:hidden">
      <tbody>
        <tr style="width:100%">
          <td>
            <!-- Header with Gradient -->
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:linear-gradient(to right, #8338EC, #FF006E);padding:32px;text-align:center">
              <tbody>
                <tr>
                  <td>
                    <p style="font-size:32px;font-weight:700;color:rgb(255,255,255);margin:0px;letter-spacing:0.025em;line-height:24px">
                      VoltStream
                    </p>
                    <p style="font-size:14px;color:rgba(255,255,255,0.8);margin:0px;margin-top:4px;line-height:24px">
                      LIVE STREAMING PLATFORM
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <!-- Main Content -->
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="padding:40px">
              <tbody>
                <tr>
                  <td>
                    <p style="font-size:28px;font-weight:700;color:rgb(255,255,255);text-align:center;margin:0px;margin-bottom:16px">
                      ${title}
                    </p>
                    <p style="font-size:16px;color:rgb(224,224,224);line-height:24px;margin:0px;margin-bottom:32px;text-align:center">
                      ${message}
                    </p>
                    
                    <!-- OTP Code Box -->
                    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:rgb(10,10,10);border-radius:12px;padding:32px;margin-bottom:32px;border:2px solid #8338EC">
                      <tbody>
                        <tr>
                          <td>
                            <p style="font-size:14px;color:rgb(153,153,153);margin:0px;margin-bottom:8px;text-align:center">
                              Your verification code is:
                            </p>
                            <p style="font-size:48px;font-weight:700;color:rgb(255,0,110);margin:0px;text-align:center;letter-spacing:8px;font-family:monospace">
                              ${otp}
                            </p>
                            <p style="font-size:12px;color:rgb(153,153,153);margin:0px;margin-top:16px;text-align:center">
                              This code expires in 10 minutes
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    
                    <!-- Security Notice -->
                    <p style="font-size:14px;color:rgb(224,224,224);line-height:20px;margin:0px;margin-bottom:24px;text-align:center;background-color:rgba(131,56,236,0.1);padding:16px;border-radius:8px;border-left:4px solid #8338EC">
                      🔒 <strong style="color:rgb(255,0,110)">Security Notice:</strong> 
                      Never share this code with anyone. VoltStream will never ask for your verification code.
                    </p>
                    
                    <p style="font-size:14px;color:rgb(153,153,153);text-align:center;margin:0px">
                      If you didn't request this code, please ignore this email.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
            
            <!-- Footer -->
            <hr style="border-color:rgb(51,51,51);margin-top:32px;margin-bottom:32px;width:100%;border:none;border-top:1px solid #333" />
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="padding-left:40px;padding-right:40px;padding-bottom:40px">
              <tbody>
                <tr>
                  <td>
                    <p style="font-size:12px;color:rgb(153,153,153);text-align:center;margin:0px;margin-bottom:8px">
                      VoltStream Inc.
                    </p>
                    <p style="font-size:12px;color:rgb(102,102,102);text-align:center;margin:0px;margin-top:8px">
                      © 2025 VoltStream Inc. All rights reserved.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>
          `;
        };

        await resend.emails.send({
          from: "VoltStream <noreply@voltstreambackend.space>",
          to: email,
          subject:
            type === "email-verification"
              ? "Verify Your Email - VoltStream"
              : type === "sign-in"
                ? "Sign In to VoltStream"
                : "Reset Your Password - VoltStream",
          html: getEmailContent(otp, type),
        });
        
        console.log(`✅ OTP email sent successfully to ${email} (type: ${type})`);
      } catch (error) {
        console.error('❌ Failed to send OTP email:', error);
        // Rethrow so Better Auth knows the email failed
        throw new Error(`Failed to send verification email: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
      otpLength: 6,
      expiresIn: 600, // 10 minutes
      allowedAttempts: 3,
    }),
  ],
});
