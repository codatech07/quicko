const nodemailer = require("nodemailer");
const dns = require("dns");

dns.setDefaultResultOrder(["1.1.1.1", "8.8.8.8"]);
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  const mailOptions = {
    from: `Quicko App <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  await transporter.sendMail(mailOptions);
};
module.exports = sendEmail;
