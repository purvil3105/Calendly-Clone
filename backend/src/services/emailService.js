const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initPromise = this.init();
  }

  async init() {
    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_USER !== 'your-email@gmail.com') {
        // Use real SMTP credentials
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT, 10) || 587,
          secure: process.env.SMTP_PORT === '465', 
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        this.isReal = true;
        console.log("Email service initialized (Real SMTP)");
      } else {
        // Fallback to test Ethereal account
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false, 
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        this.isReal = false;
        console.log("Email service initialized (Ethereal Fallback)");
      }
    } catch (err) {
      console.error("Failed to initialize Ethereal email account:", err);
    }
  }

  async getTransporter() {
    if (!this.transporter) {
      await this.initPromise;
    }
    return this.transporter;
  }

  async sendBookingConfirmation(meeting, eventType) {
    const transporter = await this.getTransporter();
    if (!transporter) return;
    
    const info = await transporter.sendMail({
      from: '"Calendly Clone" <no-reply@calendly-clone.test>',
      to: meeting.inviteeEmail,
      subject: `Confirmed: ${eventType.name} with Demo User`,
      text: `Your meeting has been scheduled for ${meeting.startAt}.\n\nTo reschedule, visit: http://localhost:3001/reschedule/${meeting.id}`,
      html: `
        <h3>Meeting Confirmed</h3>
        <p>Your meeting <strong>${eventType.name}</strong> with Demo User has been scheduled.</p>
        <p><strong>Start:</strong> ${meeting.startAt}</p>
        <p><strong>End:</strong> ${meeting.endAt}</p>
        <hr/>
        <p>If you need to reschedule, <a href="http://localhost:3001/reschedule/${meeting.id}">click here</a>.</p>
      `,
    });
    
    if (this.isReal) {
      console.log("Booking email sent to: %s", meeting.inviteeEmail);
    } else {
      console.log("Booking email sent. Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
  }

  async sendRescheduleNotice(meeting, eventType) {
    const transporter = await this.getTransporter();
    if (!transporter) return;
    
    const info = await transporter.sendMail({
      from: '"Calendly Clone" <no-reply@calendly-clone.test>',
      to: meeting.inviteeEmail,
      subject: `Rescheduled: ${eventType.name} with Demo User`,
      text: `Your meeting has been rescheduled to ${meeting.startAt}.\n\nTo reschedule again, visit: http://localhost:3001/reschedule/${meeting.id}`,
      html: `
        <h3>Meeting Rescheduled</h3>
        <p>Your meeting <strong>${eventType.name}</strong> with Demo User has been rescheduled.</p>
        <p><strong>New Start:</strong> ${meeting.startAt}</p>
        <p><strong>New End:</strong> ${meeting.endAt}</p>
        <hr/>
        <p>If you need to reschedule, <a href="http://localhost:3001/reschedule/${meeting.id}">click here</a>.</p>
      `,
    });
    
    if (this.isReal) {
      console.log("Reschedule email sent to: %s", meeting.inviteeEmail);
    } else {
      console.log("Reschedule email sent. Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
  }

  async sendCancellationNotice(meeting, eventType) {
    const transporter = await this.getTransporter();
    if (!transporter) return;
    
    const info = await transporter.sendMail({
      from: '"Calendly Clone" <no-reply@calendly-clone.test>',
      to: meeting.inviteeEmail,
      subject: `Cancelled: ${eventType.name} with Demo User`,
      text: `Your meeting scheduled for ${meeting.startAt} has been cancelled.`,
      html: `
        <h3>Meeting Cancelled</h3>
        <p>Your meeting <strong>${eventType.name}</strong> with Demo User has been cancelled.</p>
      `,
    });
    
    if (this.isReal) {
      console.log("Cancellation email sent to: %s", meeting.inviteeEmail);
    } else {
      console.log("Cancellation email sent. Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
  }
}

module.exports = new EmailService();
