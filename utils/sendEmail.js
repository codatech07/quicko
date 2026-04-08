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
    await apiInstance.sendTransacEmail(sendSmtpEmail);
  } catch (err) {
    console.log("BREVO ERROR:", err.response?.body || err.message);
    throw new AppError("Email sending failed", 500);
  }
};

module.exports = sendEmail;