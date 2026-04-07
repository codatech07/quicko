const nodemailer = require("nodemailer");

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
  try {
    console.log("before send email");
    await transporter.sendMail(mailOptions);
    console.log("after send email");
    res.json({ message: "sent" });
  } catch (error) {
    console.log("wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww ", error);
    res.status(500).json({ error: error.message });
  }
};
module.exports = sendEmail;
