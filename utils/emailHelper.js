const nodemailer = require('nodemailer');

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    return entities[character];
  });

const sendWelcomeEmail = async (userEmail, username) => {
  try {
    const port = Number(process.env.EMAIL_PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('EMAIL_PORT must be a valid port number.');
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const safeUsername = escapeHtml(username);
    const mailOptions = {
      from: `"My Node App Support" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Welcome to Our Platform!',
      text: `Hello ${username},\n\nThank you for registering an account on our platform. You can log in at http://localhost:3000/login.html.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 24px;">
          <h2 style="color: #48bb78; text-align: center;">Welcome Aboard, ${safeUsername}!</h2>
          <p style="font-size: 16px; color: #4a5568; line-height: 1.6;">
            Thank you for registering an account on our platform.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/login.html" style="background-color: #48bb78; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              Log in to your account
            </a>
          </div>
          <p style="font-size: 12px; color: #a0aec0; text-align: center; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            If you did not sign up for this account, please ignore this email or contact our support team.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent successfully. Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
};

module.exports = sendWelcomeEmail;
