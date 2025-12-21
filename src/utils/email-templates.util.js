const COLORS = {
  primary: "#b06419",
  secondary: "#a55d16",
  tertiary: "#ca9a5a",
  light: "#f7f4ea",
  surface: "#f7edce",
  text: "#5c2e06",
  textSecondary: "#6c5538",
  border: "#dcc9a1",
  buttonBg: "#82480e",
  buttonHover: "#9c7543",
};

const getClientUrl = () => process.env.CLIENT_URL || "http://localhost:5173";

// Email Base Template
const emailBaseTemplate = (
  subject,
  content,
  buttonUrl = null,
  buttonText = null
) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        line-height: 1.6; 
        color: ${COLORS.text}; 
        margin: 0; 
        padding: 0;
        background-color: ${COLORS.light};
      }
      .email-container { 
        max-width: 600px; 
        margin: 0 auto; 
        padding: 0;
        background-color: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .header { 
        background: linear-gradient(135deg, ${COLORS.primary}, ${
  COLORS.secondary
}); 
        color: white; 
        padding: 40px 20px; 
        text-align: center;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      }
      .header h1 { 
        margin: 0; 
        font-size: 28px; 
        font-weight: 600;
      }
      .content { 
        padding: 40px; 
        color: ${COLORS.text};
      }
      .content h2 { 
        color: ${COLORS.primary}; 
        margin-top: 0;
        font-size: 20px;
      }
      .content p { 
        margin: 12px 0; 
        font-size: 14px;
        line-height: 1.8;
      }
      .button-container {
        text-align: center;
        margin: 30px 0;
      }
      .button { 
        display: inline-block; 
        padding: 14px 40px; 
        background: linear-gradient(135deg, ${COLORS.primary}, ${
  COLORS.secondary
});
        color: white; 
        text-decoration: none; 
        border-radius: 6px; 
        font-weight: 600;
        font-size: 15px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(176, 100, 25, 0.3);
      }
      .button:hover { 
        background: linear-gradient(135deg, ${COLORS.secondary}, ${
  COLORS.primary
});
        box-shadow: 0 6px 16px rgba(176, 100, 25, 0.4);
        transform: translateY(-2px);
      }
      .link-text { 
        word-break: break-all; 
        color: ${COLORS.primary};
        font-size: 12px;
        margin: 10px 0;
        padding: 8px;
        background-color: ${COLORS.surface};
        border-radius: 4px;
        border-left: 4px solid ${COLORS.tertiary};
      }
      .info-box {
        background-color: ${COLORS.surface};
        border-left: 4px solid ${COLORS.tertiary};
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
      }
      .info-box strong { color: ${COLORS.primary}; }
      .footer { 
        text-align: center; 
        padding: 20px; 
        color: ${COLORS.textSecondary}; 
        font-size: 12px;
        background-color: ${COLORS.light};
        border-top: 1px solid ${COLORS.border};
      }
      .divider { 
        border-bottom: 2px solid ${COLORS.tertiary}; 
        margin: 20px 0; 
      }
      .highlight { 
        color: ${COLORS.primary}; 
        font-weight: 600; 
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <h1>${subject}</h1>
      </div>
      <div class="content">
        ${content}
        ${
          buttonUrl && buttonText
            ? `
          <div class="button-container">
            <a href="${buttonUrl}" class="button">${buttonText}</a>
          </div>
          <p class="link-text">${buttonUrl}</p>
        `
            : ""
        }
      </div>
      <div class="footer">
        <p>&copy; 2024 E-Guide. All rights reserved.</p>
        <p>If you have any questions, please contact us at support@eguide.com</p>
      </div>
    </div>
  </body>
  </html>
`;

// Deactivation Email
export function deactivationEmailTemplate(name) {
  const content = `
    <h2>Account Deactivation Notice</h2>
    <p>Hello <span class="highlight">${name}</span>,</p>
    <p>Your E-Guide account has been deactivated. If this was done in error, you can easily reactivate it at any time by logging in.</p>
    <div class="info-box">
      <strong>⏱️ Note:</strong> You can reactivate your account anytime by clicking the reactivation link sent when you attempt to log in.
    </div>
    <p>We hope to see you back soon!</p>
  `;
  return {
    subject: "Your Account Has Been Deactivated",
    text: `Hi ${name},\n\nYour account has been deactivated. If this was a mistake, you can reactivate your account using the link sent when you try to log in.`,
    html: emailBaseTemplate("Account Deactivated", content),
  };
}

// Activation Email (with link)
export function activationEmailTemplate(name, activationUrl) {
  const content = `
    <h2>Reactivate Your Account</h2>
    <p>Hello <span class="highlight">${name}</span>,</p>
    <p>We noticed your E-Guide account is currently deactivated. To regain access and continue enjoying our services, please reactivate your account by clicking the button below:</p>
    <div class="button-container">
      <a href="${activationUrl}" class="button">Reactivate Account</a>
    </div>
    <p class="link-text">${activationUrl}</p>
    <div class="info-box">
      <strong>⏱️ Important:</strong> This reactivation link expires in <strong>24 hours</strong>.
    </div>
    <p>If you did not request this, you can safely ignore this email.</p>
  `;
  return {
    subject: "Reactivate Your Account",
    text: `Hi ${name},\n\nYour account is deactivated. To reactivate, click the link below:\n${activationUrl}\n\nThis link expires in 24 hours.`,
    html: emailBaseTemplate(
      "Account Reactivation",
      content,
      activationUrl,
      "Reactivate Account"
    ),
  };
}

// Activation Success Email
export function activationSuccessEmailTemplate(name) {
  const content = `
    <h2>✓ Account Reactivated Successfully</h2>
    <p>Hello <span class="highlight">${name}</span>,</p>
    <p>Great news! Your E-Guide account has been successfully reactivated. You now have full access to all features and can start exploring tours immediately.</p>
    <div class="info-box">
      <strong>🎉 Welcome Back!</strong> We're thrilled to have you back. Log in and discover amazing tour experiences.
    </div>
    <p>If you have any questions or need assistance, our support team is always here to help.</p>
  `;
  return {
    subject: "Account Reactivated Successfully",
    text: `Hi ${name},\n\nYour account has been reactivated. You can now log in and use the platform as usual.`,
    html: emailBaseTemplate("Account Reactivated", content),
  };
}
// Payment Success Email
export function paymentSuccessEmail(userName, tourName, amount) {
  const content = `
    <h2>✓ Payment Successful</h2>
    <p>Hello <span class="highlight">${userName}</span>,</p>
    <p>Excellent! Your payment has been successfully processed. Your tour booking is confirmed!</p>
    <div class="info-box">
      <p><strong>Tour:</strong> ${tourName}</p>
      <p><strong>Amount Paid:</strong> <span class="highlight">${amount} EGP</span></p>
      <p><strong>Status:</strong> <span class="highlight">✓ Confirmed</span></p>
    </div>
    <p>You will receive confirmation details and tour information via email shortly. Get ready for an unforgettable experience!</p>
    <p>If you have any questions about your booking, feel free to contact us.</p>
  `;
  return {
    subject: `Payment Successful for ${tourName}`,
    text: `Hi ${userName},\n\nYour payment of ${amount} EGP for the tour "${tourName}" was successful. Enjoy your tour!`,
    html: emailBaseTemplate("Payment Confirmed", content),
  };
}

// Payment Expiry Email
export function paymentExpiredEmail(userName, tourName) {
  const clientUrl = getClientUrl();
  const toursUrl = `${clientUrl}/tours`;
  const content = `
    <h2>⏱️ Payment Expired</h2>
    <p>Hello <span class="highlight">${userName}</span>,</p>
    <p>Your payment session for the following tour has expired:</p>
    <div class="info-box">
      <p><strong>Tour:</strong> ${tourName}</p>
      <p><strong>Status:</strong> <span class="highlight">Payment Expired</span></p>
    </div>
    <p>Don't worry! You can easily complete your booking by starting a new payment session. The tour is still available for booking.</p>
    <div class="button-container">
      <a href="${toursUrl}" class="button">Continue Booking</a>
    </div>
    <p>If you need any assistance, our team is ready to help!</p>
  `;
  return {
    subject: `Payment Expired for ${tourName}`,
    text: `Hi ${userName},\n\nYour payment for the tour "${tourName}" has expired. Please try again to enroll.`,
    html: emailBaseTemplate("Payment Expired", content),
  };
}

// Payment State Change Email
export function paymentStateChangeEmail(userName, tourName, state) {
  const stateColors = {
    completed: `<span class="highlight">✓ Completed</span>`,
    pending: `<span class="highlight">⏳ Pending</span>`,
    failed: `<span class="highlight">✗ Failed</span>`,
    cancelled: `<span class="highlight">✗ Cancelled</span>`,
  };

  const content = `
    <h2>📋 Payment Status Update</h2>
    <p>Hello <span class="highlight">${userName}</span>,</p>
    <p>Your payment status for the following tour has been updated:</p>
    <div class="info-box">
      <p><strong>Tour:</strong> ${tourName}</p>
      <p><strong>Payment Status:</strong> ${
        stateColors[state] || `<span class="highlight">${state}</span>`
      }</p>
    </div>
    <p>If you have any questions about this status update, please don't hesitate to contact us.</p>
  `;
  return {
    subject: `Payment Status Update for ${tourName}`,
    text: `Hi ${userName},\n\nYour payment for the tour "${tourName}" is now: ${state}.`,
    html: emailBaseTemplate("Payment Status Update", content),
  };
}
export const welcomeEmailTemplate1 = (name, verificationUrl) => {
  const content = `
    <h2>Welcome to E-Guide!</h2>
    <p>Hello <span class="highlight">${name}</span>,</p>
    <p>We're thrilled to have you join our community of tour enthusiasts and travel experts! E-Guide is your gateway to unforgettable travel experiences.</p>
    <div class="info-box">
      <strong>📧 Email Verification Required</strong>
      <p>To activate your account and start exploring amazing tours, please verify your email address by clicking the button below:</p>
    </div>
    <div class="button-container">
      <a href="${verificationUrl}" class="button">Verify Email Address</a>
    </div>
    <p class="link-text">${verificationUrl}</p>
    <div class="info-box">
      <strong>⏱️ Important:</strong> This verification link expires in <strong>24 hours</strong>. Please verify your email as soon as possible.
    </div>
    <p>Once verified, you'll have access to thousands of incredible tours, expert guides, and unique travel experiences.</p>
  `;
  return {
    subject: "Welcome to E-Guide - Verify Your Email",
    text: `Hi ${name},\n\nWelcome to E-Guide!\n\nPlease verify your email by clicking the link below:\n${verificationUrl}\n\nThis link expires in 24 hours.`,
    html: emailBaseTemplate(
      "Email Verification Required",
      content,
      verificationUrl,
      "Verify Email Address"
    ),
  };
};
export const welcomeEmailTemplate = (name) => {
  const content = `
    <h2>Welcome to E-Guide!</h2>
    <p>Hello <span class="highlight">${name}</span>,</p>
    <p>Welcome aboard! We're excited to have you join the E-Guide community. You're now part of a network of passionate travelers and expert tour guides.</p>
    <div class="info-box">
      <strong>🎉 You're All Set!</strong>
      <p>Your account is active and ready to explore. Start discovering amazing tours and creating unforgettable travel memories today.</p>
    </div>
    <p>Whether you're looking for cultural experiences, adventure tours, or guided city explorations, E-Guide has something special for you.</p>
    <p>If you have any questions or need assistance, our support team is always happy to help!</p>
  `;
  return {
    subject: "Welcome to E-Guide",
    text: `Hi ${name},\n\nWelcome to E-Guide!\n\nBest regards,\nE-Guide Team`,
    html: emailBaseTemplate("Welcome to E-Guide", content),
  };
};

export const resetPasswordEmailTemplate = (name, resetUrl) => {
  const content = `
    <h2>Password Reset Request</h2>
    <p>Hello <span class="highlight">${name}</span>,</p>
    <p>We received a request to reset your E-Guide account password. If you didn't make this request, you can safely ignore this email.</p>
    <div class="info-box">
      <strong>🔒 Secure Reset Link</strong>
      <p>Click the button below to securely reset your password:</p>
    </div>
    <div class="button-container">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>
    <p class="link-text">${resetUrl}</p>
    <div class="info-box">
      <strong>⏱️ Important:</strong> This link is valid for only <strong>10 minutes</strong>. If it expires, you can request a new password reset.
    </div>
    <p><strong>For your security:</strong></p>
    <ul>
      <li>Never share this link with anyone</li>
      <li>E-Guide staff will never ask for your password</li>
      <li>Always use secure passwords</li>
    </ul>
  `;
  return {
    subject: "Password Reset Request - E-Guide",
    text: `Hi ${name},\n\nYou requested a password reset.\n\nClick this link to reset your password:\n${resetUrl}\n\nThis link expires in 10 minutes.`,
    html: emailBaseTemplate(
      "Password Reset Request",
      content,
      resetUrl,
      "Reset Password"
    ),
  };
};

export const passwordResetSuccessTemplate = (name) => {
  const content = `
    <h2>✓ Password Reset Successful</h2>
    <p>Hello <span class="highlight">${name}</span>,</p>
    <p>Great news! Your password has been successfully reset. Your E-Guide account is now secured with your new password.</p>
    <div class="info-box">
      <strong>🔐 Account Secured</strong>
      <p>You can now log in with your new password and access all features of E-Guide.</p>
    </div>
    <p><strong>Next Steps:</strong></p>
    <ul>
      <li>Log in with your new password</li>
      <li>Update your security settings if needed</li>
      <li>Review recent account activity</li>
    </ul>
    <p>If you did not authorize this password reset or notice any suspicious activity, please contact our support team immediately.</p>
  `;
  return {
    subject: "Password Reset Successful - E-Guide",
    text: `Hi ${name},\n\nYour password has been successfully reset.\n\nYou can now log in with your new password.`,
    html: emailBaseTemplate("Password Reset Successful", content),
  };
};

// Interview Scheduled Email (for guide applicants)
export const interviewScheduledEmailTemplate = (
  guideFirstName,
  guideLastName,
  scheduledDate,
  scheduledTime,
  timezone
) => {
  const content = `
    <h2>📅 Your Interview Has Been Scheduled</h2>
    <p>Hello <span class="highlight">${guideFirstName} ${guideLastName}</span>,</p>
    <p>We're excited! Your guide application is progressing to the next stage. An interview has been scheduled to discuss your qualifications and experience.</p>
    <div class="info-box">
      <p><strong>📍 Interview Details</strong></p>
      <p><strong>Date:</strong> <span class="highlight">${new Date(
        scheduledDate
      ).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}</span></p>
      <p><strong>Time:</strong> <span class="highlight">${scheduledTime}</span></p>
      <p><strong>Timezone:</strong> <span class="highlight">${timezone}</span></p>
    </div>
    <p><strong>What to Expect:</strong></p>
    <ul>
      <li>Discussion of your tour guiding experience and expertise</li>
      <li>Questions about your background and specialties</li>
      <li>Overview of E-Guide platform and guide responsibilities</li>
      <li>Estimated duration: 20-30 minutes</li>
    </ul>
    <div class="info-box">
      <strong>✓ Preparation Tips</strong>
      <ul>
        <li>Ensure a stable internet connection</li>
        <li>Be in a quiet environment</li>
        <li>Have your certificates and documents ready</li>
        <li>Log in 5 minutes early</li>
      </ul>
    </div>
    <p>If you need to reschedule, please contact us as soon as possible. We're looking forward to meeting you!</p>
  `;
  return {
    subject: "Your Guide Interview has been Scheduled - E-Guide",
    text: `Hi ${guideFirstName} ${guideLastName},\n\nYour interview has been scheduled for ${scheduledDate} at ${scheduledTime} (${timezone}).\n\nPlease make sure you are available at this time.`,
    html: emailBaseTemplate("Interview Scheduled", content),
  };
};

// Application Approved Email
export const applicationApprovedEmailTemplate = (
  guideFirstName,
  guideLastName,
  approvalNotes
) => {
  const clientUrl = getClientUrl();
  const dashboardUrl = `${clientUrl}/guide/dashboard`;
  const content = `
    <h2>🎉 Congratulations! Your Application Has Been Approved</h2>
    <p>Hello <span class="highlight">${guideFirstName} ${guideLastName}</span>,</p>
    <p>We have great news! Your guide application has been reviewed and <strong>APPROVED</strong>. Welcome to the E-Guide community of professional tour guides!</p>
    <div class="info-box">
      <strong>✓ Your Journey Begins</strong>
      <p>You can now:</p>
      <ul>
        <li>Create and publish your own tours</li>
        <li>Start accepting tour bookings from travelers</li>
        <li>Access your guide dashboard</li>
        <li>Manage your profile and specialties</li>
      </ul>
    </div>
    ${
      approvalNotes
        ? `
    <div class="info-box">
      <strong>📝 Reviewer Notes:</strong>
      <p>${approvalNotes}</p>
    </div>
    `
        : ""
    }
    <div class="button-container">
      <a href="${dashboardUrl}" class="button">Access Your Dashboard</a>
    </div>
    <p><strong>Next Steps:</strong></p>
    <ul>
      <li>Complete your guide profile with a professional photo and bio</li>
      <li>Set your availability and tour rates</li>
      <li>Create your first tour offering</li>
      <li>Review our guide guidelines and best practices</li>
    </ul>
    <p>If you have any questions or need assistance, our guide support team is here to help!</p>
  `;
  return {
    subject: "Guide Application Approved - Welcome to E-Guide! 🎉",
    text: `Hi ${guideFirstName} ${guideLastName},\n\nCongratulations! Your guide application has been approved! You can now access your guide dashboard and start creating tours.`,
    html: emailBaseTemplate(
      "Application Approved",
      content,
      dashboardUrl,
      "Access Your Dashboard"
    ),
  };
};

// Application Rejected Email
export const applicationRejectedEmailTemplate = (
  guideFirstName,
  guideLastName,
  rejectionReason
) => {
  const content = `
    <h2>Application Decision - E-Guide Guide Program</h2>
    <p>Hello <span class="highlight">${guideFirstName} ${guideLastName}</span>,</p>
    <p>Thank you for applying to become a guide on E-Guide. We appreciate the time and effort you invested in your application. After careful review, we regret to inform you that your application has not been approved at this time.</p>
    ${
      rejectionReason
        ? `
    <div class="info-box">
      <strong>📋 Feedback:</strong>
      <p>${rejectionReason}</p>
    </div>
    `
        : ""
    }
    <p><strong>What This Means:</strong></p>
    <ul>
      <li>You can reapply after addressing the feedback provided</li>
      <li>We encourage you to strengthen your qualifications</li>
      <li>Consider gaining additional certifications or experience</li>
      <li>You're welcome to reach out to discuss your application</li>
    </ul>
    <div class="info-box">
      <strong>💡 Recommendations:</strong>
      <ul>
        <li>Obtain relevant tourism or guide certifications</li>
        <li>Gather more professional references</li>
        <li>Document your expertise and experience</li>
        <li>Improve your professional credentials</li>
      </ul>
    </div>
    <p>We believe in second chances! You're welcome to reapply in the future. If you have questions about your application or would like guidance on improving your profile, please don't hesitate to contact us.</p>
    <p><strong>We wish you all the best in your journey!</strong></p>
  `;
  return {
    subject: "Guide Application Decision - E-Guide",
    text: `Hi ${guideFirstName} ${guideLastName},\n\nThank you for applying to become a guide on E-Guide. Unfortunately, your application was not approved at this time. ${
      rejectionReason ? `Reason: ${rejectionReason}` : ""
    }\n\nYou are welcome to reapply in the future.`,
    html: emailBaseTemplate("Application Decision", content),
  };
};
