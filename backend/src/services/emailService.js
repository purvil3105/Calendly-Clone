const { Resend } = require('resend');

class EmailService {
  constructor() {
    this.resend = null;
    this.isReal = false;
    this.init();
  }

  init() {
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
      this.isReal = true;
      console.log("Email service initialized (Resend API)");
    } else {
      console.log("Email service initialized (Mock Mode - No RESEND_API_KEY provided)");
    }
  }

  // NOTE: Resend requires a verified domain to send from (e.g. 'onboarding@resend.dev' for testing)
  // For production, you will need to add and verify your own domain in Resend.
  getFromEmail() {
    return process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  }

  async sendBookingConfirmation(meeting, eventType) {
    if (!this.isReal) {
      console.log("Mock Email (Booking Confirmation) would be sent to:", meeting.inviteeEmail);
      return;
    }

    try {
      const data = await this.resend.emails.send({
        from: `Calendly Clone <${this.getFromEmail()}>`,
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
      console.log("Booking email sent via Resend. ID:", data.id);
    } catch (error) {
      console.error("Failed to send booking email via Resend:", error);
    }
  }

  async sendRescheduleNotice(meeting, eventType) {
    if (!this.isReal) {
      console.log("Mock Email (Reschedule Notice) would be sent to:", meeting.inviteeEmail);
      return;
    }

    try {
      const data = await this.resend.emails.send({
        from: `Calendly Clone <${this.getFromEmail()}>`,
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
      console.log("Reschedule email sent via Resend. ID:", data.id);
    } catch (error) {
      console.error("Failed to send reschedule email via Resend:", error);
    }
  }

  async sendCancellationNotice(meeting, eventType) {
    if (!this.isReal) {
      console.log("Mock Email (Cancellation Notice) would be sent to:", meeting.inviteeEmail);
      return;
    }

    try {
      const data = await this.resend.emails.send({
        from: `Calendly Clone <${this.getFromEmail()}>`,
        to: meeting.inviteeEmail,
        subject: `Cancelled: ${eventType.name} with Demo User`,
        text: `Your meeting scheduled for ${meeting.startAt} has been cancelled.`,
        html: `
          <h3>Meeting Cancelled</h3>
          <p>Your meeting <strong>${eventType.name}</strong> with Demo User has been cancelled.</p>
        `,
      });
      console.log("Cancellation email sent via Resend. ID:", data.id);
    } catch (error) {
      console.error("Failed to send cancellation email via Resend:", error);
    }
  }
}

module.exports = new EmailService();
