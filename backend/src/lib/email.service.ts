import { Resend } from 'resend';

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export class EmailService {
  private static getClient(): Resend {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    return new Resend(apiKey);
  }

  static async sendEmail(input: SendEmailInput): Promise<void> {
    const resend = this.getClient();

    await resend.emails.send({
      from: input.from || 'VoltStream <noreply@voltstreambackend.space>',
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
  }
}
