const nodemailer = require('nodemailer');

// Test email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'new385492@gmail.com', // Your email address
    pass: 'rnfb wycy zjqz xupf'   // Your Gmail password or App Password
  }
});

const mailOptions = {
  from: 'new385492@gmail.com', // Sender email address
  to: 'prov00004@gmail.com', // Recipient email address
  subject: 'Test Email', // Subject of the email
  text: 'This is a test email.' // Body of the email
};

transporter.sendMail(mailOptions, (err, info) => {
  if (err) {
    console.log('Error sending email:', err);
  } else {
    console.log('Email sent successfully:', info);
  }
});
