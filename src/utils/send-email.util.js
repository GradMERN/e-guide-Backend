import nodemailer from "nodemailer";

export const sendEmail = async (details) => {
  if (!details.to) {
    throw new Error("Recipient email is required");
  }
  if (!details.subject) {
    throw new Error("Email subject is required");
  }
  if (!details.message && !details.html) {
    throw new Error("Email content is required");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: details.to,
    subject: details.subject,
    text: details.message,
    html: details.html,
  };

  await transporter.sendMail(mailOptions);
};
