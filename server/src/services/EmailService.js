const nodemailer = require("nodemailer");
const config = require("../config");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendOTP(email, otp) {
    const mailOptions = {
      from: `"HelioScape" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: "Your HelioScape Verification Code",
      html: this.getOTPTemplate(otp),
    };

    try {
      if (!process.env.SMTP_HOST) {
        console.log("---------------------------------------------------");
        console.log(`[EmailService] Mock Sending Email to ${email}`);
        console.log(`[EmailService] OTP: ${otp}`);
        console.log("---------------------------------------------------");
        return;
      }
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Error sending email:", error);
      // Fallback for development if email fails
      console.log("---------------------------------------------------");
      console.log(`[EmailService] Fallback: OTP for ${email} is ${otp}`);
      console.log("---------------------------------------------------");
    }
  }

  getOTPTemplate(otp) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Code</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8fafc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .header {
      background: linear-gradient(135deg, #0891b2 0%, #8b5cf6 100%);
      padding: 40px 0;
      text-align: center;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 40px;
      text-align: center;
    }
    .message {
      color: #334155;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .otp-container {
      background: #f1f5f9;
      border-radius: 12px;
      padding: 24px;
      margin: 0 auto 32px;
      display: inline-block;
      border: 1px solid #e2e8f0;
    }
    .otp-code {
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 8px;
      color: #0f172a;
      margin: 0;
    }
    .footer {
      background: #f8fafc;
      padding: 24px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      color: #64748b;
      font-size: 12px;
      margin: 0;
    }
    .highlight {
      color: #0891b2;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>HelioScape</h1>
    </div>
    <div class="content">
      <p class="message">Hello,</p>
      <p class="message">Please use the verification code below to complete your login or verify your account. This code will expire in 10 minutes.</p>
      
      <div class="otp-container">
        <p class="otp-code">${otp}</p>
      </div>
      
      <p class="message">If you didn't request this code, you can safely ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} HelioScape. All rights reserved.</p>
      <p>Secure Cloud Storage & Visualization</p>
    </div>
  </div>
</body>
</html>
    `;
  }
}

module.exports = new EmailService();
