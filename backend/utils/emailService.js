const nodemailer = require('nodemailer');

console.log('Initializing email service with settings:');
console.log(`- Host: ${process.env.EMAIL_HOST || 'smtppro.zoho.in'}`);
console.log(`- Port: ${process.env.EMAIL_PORT || '465'}`);
console.log(`- Secure: ${process.env.EMAIL_SECURE === 'true' ? 'true' : 'false'}`);
console.log(`- User: ${process.env.EMAIL_USER || '[not set]'}`);
console.log(`- Password: ${process.env.EMAIL_PASSWORD ? '[set]' : '[not set]'}`);

// Create a transporter object using Zoho SMTP with SSL
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtppro.zoho.in',
  port: parseInt(process.env.EMAIL_PORT || 465),
  secure: process.env.EMAIL_SECURE === 'true', // true for port 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    // Do not fail on invalid certificates
    rejectUnauthorized: false
  },
  debug: true // Enable debug logs
});

// Test connection immediately to verify settings
transporter.verify(function(error, success) {
  if (error) {
    console.error('SMTP server connection error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error command:', error.command);
  } else {
    console.log('SMTP server connection successfully established, ready to send emails');
  }
});

// Email domain validation function
const validateEmailDomain = (email) => {
  // List of accepted domains
  const acceptedDomains = ['gmail.com'];
  
  // Basic email format validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;
  if (!emailRegex.test(email)) {
    return { 
      isValid: false,
      message: 'Please enter a valid email address format'
    };
  }
  
  // Extract domain from email
  const domain = email.split('@')[1].toLowerCase();
  
  // Check if domain is in accepted list
  if (!acceptedDomains.includes(domain)) {
    return { 
      isValid: false,
      message: `Currently only ${acceptedDomains.join(', ')} email addresses are accepted`
    };
  }
  
  return { isValid: true, message: '' };
};

// Welcome email template
const welcomeEmail = (name, email) => {
  const currentYear = new Date().getFullYear();
  
  return {
    from: `"To-Do App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to To-Do App!',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="background-color: #6f19d2; color: white; padding: 15px; border-radius: 8px;">
            <h2 style="margin: 0; font-size: 24px;">Welcome to To-Do App!</h2>
          </div>
        </div>
        
        <p style="font-size: 16px; color: #333; margin-top: 25px;">Hello ${name},</p>
        
        <p style="font-size: 16px; color: #333; line-height: 1.5;">Thank you for joining our <strong>To-Do App</strong>! We're excited to have you on board.</p>
        
        <div style="background-color: #f9f9f9; border-left: 4px solid #6f19d2; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="font-size: 16px; color: #333; margin: 0;">With our app, you can:</p>
          <ul style="font-size: 16px; color: #333; margin-top: 10px; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Create and organize tasks with priorities</li>
            <li style="margin-bottom: 8px;">Set up recurring tasks with smart scheduling</li>
            <li style="margin-bottom: 8px;">Receive notifications for upcoming deadlines</li>
            <li style="margin-bottom: 8px;">Track your progress and boost productivity</li>
          </ul>
        </div>
        
        <p style="font-size: 16px; color: #333; line-height: 1.5;">Get started by adding your first task today!</p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${process.env.PUBLIC_URL || 'http://localhost:5173'}" 
             style="background-color: #6f19d2; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            Start Using To-Do App
          </a>
        </div>
        
        <div style="margin-top: 30px; text-align: center; border-top: 1px solid #e0e0e0; padding-top: 20px;">
          <p style="font-size: 12px; color: #999;">This is an automated message from To-Do App. Please do not reply.</p>
          <p style="font-size: 12px; color: #999;">&copy; ${currentYear} To-Do App. All rights reserved.</p>
        </div>
      </div>
    `
  };
};

// Password reset email template
const passwordResetEmail = (name, email, resetToken) => {
  const resetLink = `${process.env.PUBLIC_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
  const currentYear = new Date().getFullYear();
  
  return {
    from: `"To-Do App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Your To-Do App Password',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="background-color: #6f19d2; color: white; padding: 15px; border-radius: 8px;">
            <h2 style="margin: 0; font-size: 24px;">Password Reset</h2>
          </div>
        </div>
        
        <p style="font-size: 16px; color: #333; margin-top: 25px;">Hello ${name},</p>
        
        <p style="font-size: 16px; color: #333; line-height: 1.5;">We received a request to reset the password for your <strong>To-Do App</strong> account. If you didn't make this request, please ignore this email or contact support.</p>
        
        <div style="background-color: #f9f9f9; border-left: 4px solid #6f19d2; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="font-size: 16px; color: #333; margin: 0;">To reset your password, click on the secure button below:</p>
        </div>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${resetLink}" 
             style="background-color: #6f19d2; color: white; padding: 14px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
            Reset My Password
          </a>
        </div>
        
        <div style="margin-top: 25px; border-top: 1px solid #e0e0e0; padding-top: 20px;">
          <p style="font-size: 14px; color: #666; line-height: 1.5;"><strong>Security Notice:</strong> This link will expire in 1 hour for your protection.</p>
          <p style="font-size: 14px; color: #666; line-height: 1.5;">If you're having trouble clicking the button, copy and paste this URL into your web browser:</p>
          <p style="font-size: 13px; color: #999; word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px;">${resetLink}</p>
        </div>
        
        <div style="margin-top: 30px; text-align: center; border-top: 1px solid #e0e0e0; padding-top: 20px;">
          <p style="font-size: 12px; color: #999;">This is an automated message from To-Do App. Please do not reply.</p>
          <p style="font-size: 12px; color: #999;">&copy; ${currentYear} To-Do App. All rights reserved.</p>
        </div>
      </div>
    `
  };
};

const sendEmail = async (mailOptions) => {
  try {
    console.log('Attempting to send email to:', mailOptions.to);
    console.log('Email subject:', mailOptions.subject);
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      message: error.message
    });
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendWelcomeEmail: async (name, email) => {
    // Email validation already performed during registration, but double-check
    const validation = validateEmailDomain(email);
    if (!validation.isValid) {
      return { success: false, error: validation.message };
    }
    return await sendEmail(welcomeEmail(name, email));
  },
  sendPasswordResetEmail: async (name, email, resetToken) => {
    // Email validation already performed during registration, but double-check
    const validation = validateEmailDomain(email);
    if (!validation.isValid) {
      return { success: false, error: validation.message };
    }
    return await sendEmail(passwordResetEmail(name, email, resetToken));
  },
  validateEmailDomain // Export the validation function for use in registration
};
