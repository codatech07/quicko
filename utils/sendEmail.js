const nodemailer = require("nodemailer");
const dns = require("dns");

// 🔥 مهم جداً: إجبار IPv4 بدل IPv6
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
  });

  await transporter.verify();

  return transporter.sendMail({
    from: `Quicko App <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  });
};

module.exports = sendEmail;