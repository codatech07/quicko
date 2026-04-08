// const AppError = require("./AppError");
// const nodemailer = require("nodemailer");
// const sendEmail = async (options) => {
//   try {
//     // const transporter = nodemailer.createTransport({
//     //   host: process.env.EMAIL_HOST,
//     //   port: process.env.EMAIL_PORT,
//     //   secure: false,
//     //   auth: {
//     //     user: process.env.EMAIL_USER,
//     //     pass: process.env.EMAIL_PASS,
//     //   },
//     // });
//     const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS, // App Password مو الباسورد العادي
//   },
// });

//     const mailOptions = {
//       from: `Quicko App <${process.env.EMAIL_USER}>`,
//       to: options.email,
//       subject: options.subject,
//       text: options.message,
//     };
//     console.log("before send email");
//     const info = await transporter.sendMail(mailOptions);
//     console.log("after send email");
//     return info;
//   } catch (err) {
//   console.log("EMAIL ERROR:", err);
//   throw new AppError("Email sending failed", 500);
// }
// };

const AppError = require("./AppError");
const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App Password
      },
    });

    const mailOptions = {
      from: `Quicko App <${process.env.EMAIL_USER}>`, // ✅ fix هنا
      to: options.email,
      subject: options.subject,

      // نص عادي
      text: options.message,

      // ✨ نسخة HTML (أفضل)
      html: `
        <div style="font-family: Arial; text-align: center;">
          <h2>Email Verification</h2>
          <p>Your verification code is:</p>
          <h1 style="letter-spacing: 5px;">${options.message}</h1>
          <p>This code will expire soon</p>
        </div>
      `,
    };

    console.log("before send email");

    const info = await transporter.sendMail(mailOptions);

    console.log("after send email");
    console.log("Message ID:", info.messageId);

    return info;
  } catch (err) {
    console.log("EMAIL ERROR:", err);
    throw new AppError("Email sending failed", 500);
  }
};

module.exports = sendEmail;
