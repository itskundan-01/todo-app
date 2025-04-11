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
    subject: 'Welcome to To-Do App! Get Started Now',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f9f9fa;">
        <!-- Header with logo area -->
        <div style="background-color: #6f19d2; text-align: center; padding: 30px 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px; color: white; font-weight: 700;">Welcome to To-Do App!</h1>
          <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin-top: 8px; margin-bottom: 0;">Your journey to better productivity starts now</p>
        </div>
        
        <!-- Main content area -->
        <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333; margin-top: 0; line-height: 1.5;">Hey ${name},</p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">We're thrilled to welcome you to <strong>To-Do App</strong>! You've taken the first step toward mastering your time and boosting your productivity.</p>
          
          <div style="background-color: #f8f5ff; border-left: 4px solid #6f19d2; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <h2 style="margin-top: 0; color: #333; font-size: 18px;">✨ What makes To-Do App special?</h2>
            <ul style="font-size: 16px; color: #333; margin: 15px 0 0; padding-left: 20px; line-height: 1.7;">
              <li style="margin-bottom: 10px;"><strong>Smart Task Management</strong> - Create, organize and prioritize tasks with intuitive tools</li>
              <li style="margin-bottom: 10px;"><strong>Intelligent Scheduling</strong> - Set up recurring patterns for classes, meetings, and routines</li>
              <li style="margin-bottom: 10px;"><strong>Timely Notifications</strong> - Stay on track with helpful reminders before deadlines</li>
              <li style="margin-bottom: 0px;"><strong>Visual Progress Tracking</strong> - See your productivity journey at a glance</li>
            </ul>
          </div>
          
          <h3 style="color: #333; font-size: 18px; margin: 25px 0 15px;">🚀 Ready to get started?</h3>
          <p style="font-size: 16px; color: #333; margin-bottom: 25px; line-height: 1.6;">Add your first task now and experience how To-Do App can transform your productivity.</p>
          
          <div style="text-align: center; margin: 35px 0 25px;">
            <a href="${process.env.PUBLIC_URL}"
               style="background-color: #6f19d2; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 3px 8px rgba(111,25,210,0.3); transition: all 0.2s ease;">
              Get Started Now
            </a>
          </div>
          
          <p style="font-size: 16px; color: #555; margin: 30px 0 20px; line-height: 1.6; text-align: center;">
            Need help? <a href="mailto:support@todoapp.com" style="color: #6f19d2; text-decoration: none; font-weight: 500;">Contact our support team</a>
          </p>
          
          <div style="margin-top: 40px; text-align: center; border-top: 1px solid #eaeaea; padding-top: 25px;">
            <p style="font-size: 14px; color: #999; margin: 0 0 5px;">You're receiving this email because you signed up for To-Do App. Please do not reply.</p>
            <p style="font-size: 13px; color: #999; margin: 0;">© ${currentYear} To-Do App. All rights reserved.</p>
          </div>
        </div>
      </div>
    `
  };
};

// Password reset email template
const passwordResetEmail = (name, email, resetToken) => {
  const resetLink = `${process.env.PUBLIC_URL}/reset-password/${resetToken}`;
  const currentYear = new Date().getFullYear();
  
  return {
    from: `"To-Do App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset Your To-Do App Password',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f9f9fa;">
        <!-- Header with logo area -->
        <div style="background-color: #6f19d2; text-align: center; padding: 30px 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px; color: white; font-weight: 700;">Reset Your Password</h1>
          <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin-top: 8px; margin-bottom: 0;">Secure account access for To-Do App</p>
        </div>
        
        <!-- Main content area -->
        <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333; margin-top: 0; line-height: 1.5;">Hello ${name},</p>
          
          <p style="font-size: 16px; color: #333; line-height: 1.6;">We received a request to reset the password for your <strong>To-Do App</strong> account. To complete the process, please click the button below:</p>
          
          <div style="background-color: #fff9f1; border-left: 4px solid #ff9800; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <h2 style="margin: 0; color: #333; font-size: 18px;">🔒 Security Notice</h2>
            <p style="font-size: 15px; color: #555; margin: 10px 0 0;">This password reset link will expire in <strong>1 hour</strong> for your protection. If you didn't request this change, please ignore this email or contact support.</p>
          </div>
          
          <div style="text-align: center; margin: 35px 0 25px;">
            <a href="${resetLink}" 
               style="background-color: #6f19d2; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 3px 8px rgba(111,25,210,0.3); transition: all 0.2s ease;">
              Reset My Password
            </a>
          </div>
          
          <div style="margin: 30px 0; padding: 20px; background-color: #f5f5f7; border-radius: 6px;">
            <p style="font-size: 14px; color: #555; line-height: 1.5; margin: 0 0 10px;">If the button above doesn't work, copy and paste this URL into your browser:</p>
            <p style="font-size: 13px; color: #666; word-break: break-all; background-color: white; padding: 12px; border-radius: 4px; border: 1px solid #e0e0e0; margin: 0; line-height: 1.5;">${resetLink}</p>
          </div>
          
          <p style="font-size: 16px; color: #555; margin: 30px 0 20px; line-height: 1.6; text-align: center;">
            Need help? <a href="mailto:support@todoapp.com" style="color: #6f19d2; text-decoration: none; font-weight: 500;">Contact our support team</a>
          </p>
          
          <div style="margin-top: 40px; text-align: center; border-top: 1px solid #eaeaea; padding-top: 25px;">
            <p style="font-size: 14px; color: #999; margin: 0 0 5px;">You're receiving this email because a password reset was requested for your To-Do App account.</p>
            <p style="font-size: 13px; color: #999; margin: 0;">© ${currentYear} To-Do App. All rights reserved.</p>
          </div>
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
