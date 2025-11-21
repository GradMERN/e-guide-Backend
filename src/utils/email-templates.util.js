// Payment Success Email
export function paymentSuccessEmail(userName, tourName, amount) {
  return {
    subject: `Payment Successful for ${tourName}`,
    text: `Hi ${userName},\n\nYour payment of ${amount} EGP for the tour "${tourName}" was successful. Enjoy your tour!`,
    html: `<p>Hi ${userName},</p><p>Your payment of <b>${amount} EGP</b> for the tour <b>${tourName}</b> was successful. Enjoy your tour!</p>`,
  };
}

// Payment Expiry Email
export function paymentExpiredEmail(userName, tourName) {
  return {
    subject: `Payment Expired for ${tourName}`,
    text: `Hi ${userName},\n\nYour payment for the tour "${tourName}" has expired. Please try again to enroll.`,
    html: `<p>Hi ${userName},</p><p>Your payment for the tour <b>${tourName}</b> has expired. Please try again to enroll.</p>`,
  };
}

// Payment State Change Email
export function paymentStateChangeEmail(userName, tourName, state) {
  return {
    subject: `Payment Status Update for ${tourName}`,
    text: `Hi ${userName},\n\nYour payment for the tour "${tourName}" is now: ${state}.`,
    html: `<p>Hi ${userName},</p><p>Your payment for the tour <b>${tourName}</b> is now: <b>${state}</b>.</p>`,
  };
}
export const welcomeEmailTemplate = (name, verificationUrl) => {
  return {
    subject: "Welcome to Tour Guide Please Verify Your Email",
    text: `
                Hi ${name},
                
                Welcome to Tour Guide!
                
                Please verify your email by clicking the link below:
                ${verificationUrl}
                
                This link expires in 24 hours.
                
                
                Best regards,
                Tour Guide Team
            `,
    html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
                        .content { background-color: #f9f9f9; padding: 30px; }
                        .button { display: inline-block; padding: 12px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to Tour Guide</h1>
                        </div>
                        <div class="content">
                            <h2>Hi ${name},</h2>
                            <p>Thank you for joining Tour Guide! We're excited to have you on board.</p>
                            <p>To get started, please verify your email address by clicking the button below:</p>
                            <div style="text-align: center;">
                                <a href="${verificationUrl}" class="button">Verify Email Address</a>
                            </div>
                            <p>Link for verfication</p>
                            <p style="word-break: break-all; color: #007bff;">${verificationUrl}</p>
                            <p><strong>This link expires in 24 hours.</strong></p>
                        </div>
                    </div>
                </body>
                </html>
            `,
  };
};

export const resetPasswordEmailTemplate = (name, resetUrl) => {
  return {
    subject: "Password Reset Request - Tour Guide",
    text: `
                Hi ${name},
                
                You requested a password reset.
                
                Click this link to reset your password:
                ${resetUrl}
                
                This link expires in 10 minutes.
                
                
                Best regards,
                Tour Guide Team
            `,
    html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
                        .content { background-color: #f9f9f9; padding: 30px; }
                        .button { display: inline-block; padding: 12px 30px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 15px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Password Reset Request</h1>
                        </div>
                        <div class="content">
                            <h2>Hi ${name},</h2>
                            <p>You requested to reset your password for your Tour Guide account.</p>
                            <p>Click the button below to reset your password:</p>
                            <div style="text-align: center;">
                                <a href="${resetUrl}" class="button">Reset Password</a>
                            </div>
                            <p>Link for reset</p>
                            <p style="word-break: break-all; color: #dc3545;">${resetUrl}</p>
                            <div class="warning">
                                <p><strong>This link expires in 10 minutes.</strong></p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `,
  };
};

export const passwordResetSuccessTemplate = (name) => {
  return {
    subject: "Password Reset Successful - Tour Guide",
    text: `
                Hi ${name},
                
                Your password has been successfully reset.
                
                
                Best regards,
                Tour Guide Team
            `,
    html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
                        .content { background-color: #f9f9f9; padding: 30px; }
                        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Password Reset Successful</h1>
                        </div>
                        <div class="content">
                            <h2>Hi ${name},</h2>
                            <p>Your password has been successfully reset.</p>
                            <p>You can now log in with your new password.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
  };
};
