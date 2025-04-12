const generateAiFeatureAnnouncementEmail = (recipientName) => {
  const currentYear = new Date().getFullYear();

  return {
    from: '"To-Do App" <noreply@kundanprojects.space>',
    subject: 'Introducing Our New AI Feature!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9fa;">
        <div style="background-color: #6f19d2; color: white; text-align: center; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px; line-height: 1.3;">Exciting News from To-Do App!</h1>
        </div>

        <div style="background-color: white; padding: 20px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Dear ${recipientName},
          </p>

          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            We are thrilled to introduce our latest feature: <strong>AI Task Assistant</strong>! This cutting-edge tool is designed to make your task management smarter and more efficient than ever before.
          </p>

          <ul style="font-size: 16px; color: #333; line-height: 1.6; margin: 15px 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Effortlessly create tasks using natural language.</li>
            <li style="margin-bottom: 8px;">Get intelligent suggestions for task scheduling and organization.</li>
            <li style="margin-bottom: 8px;">Enjoy a conversational interface for seamless task creation.</li>
          </ul>

          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Experience the future of productivity today. Update your app to explore this exciting new feature!
          </p>

          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.PUBLIC_URL}" 
               style="background-color: #6f19d2; 
                     color: white; 
                     padding: 12px 20px; 
                     text-decoration: none; 
                     border-radius: 6px; 
                     font-weight: bold; 
                     font-size: 15px; 
                     display: inline-block;
                     word-break: keep-all;
                     white-space: nowrap;
                     box-shadow: 0 4px 8px rgba(111,25,210,0.25);">Try AI Task Assistant Now</a>
          </div>

          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Thank you for being a valued user of To-Do App. We hope this feature enhances your productivity and makes task management a breeze.
          </p>

          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            Best regards,<br>
            <strong>Kundan</strong><br>
            To-Do App Team
          </p>

          <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 15px;">
            <p style="margin: 5px 0;">You're receiving this email because you're a registered user of To-Do App.</p>
            <p style="margin: 5px 0;">© ${currentYear} To-Do App. All rights reserved.</p>
          </div>
        </div>
      </div>
    `
  };
};

module.exports = generateAiFeatureAnnouncementEmail;