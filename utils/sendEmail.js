// // const AppError = require("./AppError");
// // const nodemailer = require("nodemailer");
// // const sendEmail = async (options) => {
// //   try {
// //     // const transporter = nodemailer.createTransport({
// //     //   host: process.env.EMAIL_HOST,
// //     //   port: process.env.EMAIL_PORT,
// //     //   secure: false,
// //     //   auth: {
// //     //     user: process.env.EMAIL_USER,
// //     //     pass: process.env.EMAIL_PASS,
// //     //   },
// //     // });
// //     const transporter = nodemailer.createTransport({
// //   service: "gmail",
// //   auth: {
// //     user: process.env.EMAIL_USER,
// //     pass: process.env.EMAIL_PASS, // App Password مو الباسورد العادي
// //   },
// // });

// //     const mailOptions = {
// //       from: `Quicko App <${process.env.EMAIL_USER}>`,
// //       to: options.email,
// //       subject: options.subject,
// //       text: options.message,
// //     };
// //     console.log("before send email");
// //     const info = await transporter.sendMail(mailOptions);
// //     console.log("after send email");
// //     return info;
// //   } catch (err) {
// //   console.log("EMAIL ERROR:", err);
// //   throw new AppError("Email sending failed", 500);
// // }
// // };

// const AppError = require("./AppError");
// const nodemailer = require("nodemailer");

// const sendEmail = async (options) => {
//   try {
//     const transporter = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//       connectionTimeout: 10000, // ⏱️ مهم جداً
//       greetingTimeout: 5000,
//       socketTimeout: 10000,
//     });

//     const mailOptions = {
//       from: `Quicko App <${process.env.EMAIL_USER}>`, // ✅ fix هنا
//       to: options.email,
//       subject: options.subject,

//       // نص عادي
//       text: options.message,

//       // ✨ نسخة HTML (أفضل)
//       html: `
//         <div style="font-family: Arial; text-align: center;">
//           <h2>Email Verification</h2>
//           <p>Your verification code is:</p>
//           <h1 style="letter-spacing: 5px;">${options.message}</h1>
//           <p>This code will expire soon</p>
//         </div>
//       `,
//     };

//     console.log("before send email");

//     await transporter.verify();
//     console.log("SMTP ready");

//     const info = await transporter.sendMail(mailOptions);

//     console.log("after send email");
//     console.log("Message ID:", info.messageId);

//     return info;
//   } catch (err) {
//     console.log("EMAIL ERROR:", err);
//     throw new AppError("Email sending failed", 500);
//   }
// };

// module.exports = sendEmail;

const SibApiV3Sdk = require("sib-api-v3-sdk");
const AppError = require("./AppError");

const client = SibApiV3Sdk.ApiClient.instance;

const apiKey = client.authentications["api-key"];
apiKey.apiKey = process.env.BREVO_API_KEY;

const sendEmail = async (options) => {
  try {
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

    const sendSmtpEmail = {
      to: [{ email: options.email }],
      sender: {
        email: process.env.EMAIL_USER,
        name: "Quicko App",
      },
      subject: options.subject,
      textContent: options.message,
      htmlContent: `
        <div style="text-align:center;font-family:Arial">
          <h2>Email Verification</h2>
          <p>Your code is:</p>
          <h1>${options.message}</h1>
        </div>
      `,
    };

    console.log("before send email");

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log("after send email");

  } catch (err) {
    console.log("BREVO ERROR:", err.response?.body || err.message);
    throw new AppError("Email sending failed", 500);
  }
};

module.exports = sendEmail;