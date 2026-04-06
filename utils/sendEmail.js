const nodemailer = require("nodemailer");
const dns = require("dns");

// 🔥 إجبار استخدام IPv4
dns.setDefaultResultOrder("ipv4first");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,

    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },

    tls: {
      rejectUnauthorized: false,
    },

    connectionTimeout: 10000, // ⏱️ مهم
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  try {
    await transporter.verify();

    const info = await transporter.sendMail({
      from: `Quicko App <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
    });

    console.log("✅ Email sent:", info.response);
  } catch (err) {
    console.error("❌ Email error:", err.message);
    throw err;
  }
};

module.exports = sendEmail;