/**
 * Email Templates for VoltStream
 * Professional HTML email templates with branding
 */

export const getOTPEmailTemplate = (otp: string, type: string): string => {
  const title =
    type === 'email-verification'
      ? 'Verify Your Email'
      : type === 'sign-in'
        ? 'Sign In to VoltStream'
        : 'Reset Your Password';

  const message =
    type === 'email-verification'
      ? 'Welcome to VoltStream! Please verify your email address to complete your registration and start streaming.'
      : type === 'sign-in'
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

export const getWelcomeEmailTemplate = (userName: string): string => {
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
                    <p style="font-size:36px;font-weight:700;color:rgb(255,255,255);text-align:center;margin:0px;margin-bottom:16px">
                      Welcome to VoltStream
                    </p>
                    <p style="font-size:20px;color:rgb(255,0,110);text-align:center;margin:0px;margin-bottom:32px;font-weight:500">
                      Your world of live streaming starts now
                    </p>
                    <p style="font-size:16px;color:rgb(224,224,224);line-height:24px;margin:0px;margin-bottom:32px">
                      🎉 Congratulations ${userName}! You've successfully created your VoltStream account. Get ready to dive into an incredible world of live streaming where entertainment never stops.
                    </p>
                    <p style="font-size:16px;color:rgb(224,224,224);line-height:24px;margin:0px;margin-bottom:40px">
                      Join millions of viewers and creators who are already experiencing the future of live entertainment. From gaming marathons to creative showcases, your next favorite stream is just a click away.
                    </p>
                    
                    <div style="text-align:center;margin-bottom:24px">
                      <a href="${process.env.FRONTEND_URL || 'https://voltstream.space'}" style="background:linear-gradient(to right, #FF006E, #8338EC);color:rgb(255,255,255);font-weight:700;font-size:18px;padding:16px 40px;border-radius:8px;text-decoration:none;display:inline-block">
                        ▶ Start Watching
                      </a>
                    </div>
                    
                    <div style="text-align:center;margin-bottom:40px">
                      <a href="${process.env.FRONTEND_URL || 'https://voltstream.space'}/profile/setup" style="border:2px solid #8338EC;color:#8338EC;font-weight:500;font-size:16px;padding:12px 32px;border-radius:8px;text-decoration:none;display:inline-block;background-color:transparent">
                        👤 Complete Your Profile
                      </a>
                    </div>
                    
                    <!-- Features Box -->
                    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color:rgb(10,10,10);border-radius:12px;padding:24px;margin-bottom:32px">
                      <tbody>
                        <tr>
                          <td>
                            <p style="font-size:18px;font-weight:700;color:rgb(255,255,255);margin:0px;margin-bottom:16px;text-align:center">
                              What's waiting for you:
                            </p>
                            <p style="font-size:14px;color:rgb(224,224,224);margin:12px 0px">
                              🔥 Trending streams from top creators
                            </p>
                            <p style="font-size:14px;color:rgb(224,224,224);margin:12px 0px">
                              👥 Join vibrant communities of like-minded viewers
                            </p>
                            <p style="font-size:14px;color:rgb(224,224,224);margin:12px 0px">
                              ⚡ Ultra-low latency streaming technology
                            </p>
                            <p style="font-size:14px;color:rgb(224,224,224);margin:12px 0px">
                              🎮 Gaming, music, art, and so much more
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    
                    <!-- Pro Tip -->
                    <p style="font-size:14px;color:rgb(224,224,224);line-height:20px;margin:0px;margin-bottom:32px;text-align:center;background-color:rgba(131,56,236,0.1);padding:16px;border-radius:8px;border-left:4px solid #8338EC">
                      💡 <strong style="color:rgb(255,0,110)">Pro Tip:</strong> 
                      Follow your favorite streamers to get notified when they go live!
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
                    <div style="text-align:center;margin-bottom:24px">
                      <p style="font-size:14px;color:rgb(224,224,224);margin:0px;margin-bottom:16px">
                        Follow us for updates:
                      </p>
                      <div>
                        <a href="https://twitter.com/voltstream" style="color:#8338EC;text-decoration:none;margin:0 8px">Twitter</a>
                        <a href="https://discord.com/voltstream" style="color:#8338EC;text-decoration:none;margin:0 8px">Discord</a>
                        <a href="https://instagram.com/voltstream" style="color:#8338EC;text-decoration:none;margin:0 8px">Instagram</a>
                        <a href="https://youtube.com/voltstream" style="color:#FF006E;text-decoration:none;margin:0 8px">YouTube</a>
                      </div>
                    </div>
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

type ApplicationDecisionStatus = 'APPROVED' | 'REJECTED';

export const getApplicationDecisionEmailTemplate = (
  userName: string,
  status: ApplicationDecisionStatus,
  rejectionReason?: string
): string => {
  const isApproved = status === 'APPROVED';
  const title = isApproved
    ? 'Your creator application was approved'
    : 'Your creator application was reviewed';
  const heading = isApproved ? 'Congratulations!' : 'Application update';
  const body = isApproved
    ? 'Your creator application has been approved. You can now access creator tools and start streaming on VoltStream.'
    : 'Your creator application was reviewed and is not approved at the moment.';

  const reasonBlock =
    !isApproved && rejectionReason
      ? `<p style="font-size:14px;color:#e0e0e0;line-height:22px;margin:16px 0 0 0;"><strong>Reviewer note:</strong> ${rejectionReason}</p>`
      : '';

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#151516;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(90deg,#8338ec,#ff006e);padding:24px;text-align:center;">
                <div style="font-size:28px;font-weight:700;">VoltStream</div>
                <div style="font-size:12px;opacity:0.9;margin-top:4px;">CREATOR REVIEW</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 12px 0;font-size:28px;line-height:1.2;">${heading}</h1>
                <p style="font-size:15px;line-height:24px;margin:0 0 12px 0;">Hi ${userName || 'Creator'},</p>
                <p style="font-size:15px;line-height:24px;margin:0;">${body}</p>
                ${reasonBlock}
                <div style="margin-top:24px;">
                  <a href="${process.env.FRONTEND_URL || 'https://voltstream.space'}" style="display:inline-block;padding:12px 20px;background:#ffffff;color:#000000;text-decoration:none;border-radius:8px;font-weight:600;">Open VoltStream</a>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
};

export const getApplicationCustomEmailTemplate = (
  userName: string,
  subject: string,
  message: string,
  reviewerName?: string
): string => {
  const safeMessage = message.replace(/\n/g, '<br />');

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;color:#ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#151516;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="background:linear-gradient(90deg,#8338ec,#ff006e);padding:24px;text-align:center;">
                <div style="font-size:28px;font-weight:700;">VoltStream</div>
                <div style="font-size:12px;opacity:0.9;margin-top:4px;">CREATOR APPLICATION SUPPORT</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 12px 0;font-size:24px;line-height:1.25;">${subject}</h1>
                <p style="font-size:15px;line-height:24px;margin:0 0 12px 0;">Hi ${userName || 'Creator'},</p>
                <p style="font-size:15px;line-height:24px;margin:0;">${safeMessage}</p>
                <p style="font-size:13px;line-height:20px;margin:24px 0 0 0;color:#a0a0a0;">Sent by: ${reviewerName || 'VoltStream review team'}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
};
