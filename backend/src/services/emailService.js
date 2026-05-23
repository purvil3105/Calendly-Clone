require('dns').setDefaultResultOrder('ipv4first');
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isReal = false;
    this.init();
  }

  init() {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        family: 4 // Force IPv4 resolution to bypass IPv6 ENETUNREACH errors on free hosts
      });
      this.isReal = true;
      console.log("Email service initialized (Nodemailer)");
    } else {
      console.log("Email service initialized (Mock Mode - No EMAIL_USER/EMAIL_PASS provided)");
    }
  }

  getFromEmail() {
    return `"Calendly Clone" <${process.env.EMAIL_USER || 'mock@example.com'}>`;
  }

  async sendBookingConfirmation(meeting, eventType) {
    if (!this.isReal) {
      console.log("Mock Email (Booking Confirmation) would be sent to:", meeting.inviteeEmail);
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.getFromEmail(),
        to: meeting.inviteeEmail,
        subject: `Confirmed: ${eventType.name} with Purvil Patel`,
        text: `Your meeting has been scheduled for ${meeting.startAt}.\n\nTo reschedule, visit: http://localhost:3001/reschedule/${meeting.id}`,
        html: `
          <h3>Meeting Confirmed</h3>
          <p>Your meeting <strong>${eventType.name}</strong> with Purvil Patel has been scheduled.</p>
          <p><strong>Start:</strong> ${meeting.startAt}</p>
          <p><strong>End:</strong> ${meeting.endAt}</p>
          <hr/>
          <p>If you need to reschedule, <a href="http://localhost:3001/reschedule/${meeting.id}">click here</a>.</p>
        `,
      });
      console.log("Booking email sent via Nodemailer. Message ID:", info.messageId);
    } catch (error) {
      console.error("Failed to send booking email via Nodemailer:", error);
    }
  }

  async sendRescheduleNotice(meeting, eventType) {
    if (!this.isReal) {
      console.log("Mock Email (Reschedule Notice) would be sent to:", meeting.inviteeEmail);
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.getFromEmail(),
        to: meeting.inviteeEmail,
        subject: `Rescheduled: ${eventType.name} with Purvil Patel`,
        text: `Your meeting has been rescheduled to ${meeting.startAt}.\n\nTo reschedule again, visit: http://localhost:3001/reschedule/${meeting.id}`,
        html: `
          <h3>Meeting Rescheduled</h3>
          <p>Your meeting <strong>${eventType.name}</strong> with Purvil Patel has been rescheduled.</p>
          <p><strong>New Start:</strong> ${meeting.startAt}</p>
          <p><strong>New End:</strong> ${meeting.endAt}</p>
          <hr/>
          <p>If you need to reschedule, <a href="http://localhost:3001/reschedule/${meeting.id}">click here</a>.</p>
        `,
      });
      console.log("Reschedule email sent via Nodemailer. Message ID:", info.messageId);
    } catch (error) {
      console.error("Failed to send reschedule email via Nodemailer:", error);
    }
  }

  async sendCancellationNotice(meeting, eventType) {
    if (!this.isReal) {
      console.log("Mock Email (Cancellation Notice) would be sent to:", meeting.inviteeEmail);
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.getFromEmail(),
        to: meeting.inviteeEmail,
        subject: `Cancelled: ${eventType.name} with Purvil Patel`,
        text: `Your meeting scheduled for ${meeting.startAt} has been cancelled.`,
        html: `
          <h3>Meeting Cancelled</h3>
          <p>Your meeting <strong>${eventType.name}</strong> with Purvil Patel has been cancelled.</p>
        `,
      });
      console.log("Cancellation email sent via Nodemailer. Message ID:", info.messageId);
    } catch (error) {
      console.error("Failed to send cancellation email via Nodemailer:", error);
    }
  }
}

module.exports = new EmailService();
