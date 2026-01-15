import axios from "axios"

const BREVO_API_KEY = process.env.BREVO_API_KEY
const BREVO_API_URL = "https://api.brevo.com/v3"

interface EmailRecipient {
  email: string
  name: string
}

interface SendEmailParams {
  to: EmailRecipient[]
  subject: string
  htmlContent: string
}

export async function sendEmail({ to, subject, htmlContent }: SendEmailParams): Promise<boolean> {
  if (!BREVO_API_KEY) {
    console.error("BREVO_API_KEY not configured")
    return false
  }

  try {
    await axios.post(
      `${BREVO_API_URL}/smtp/email`,
      {
        to,
        subject,
        htmlContent,
        sender: {
          email: "noreply@eventportal.com",
          name: "Event Portal",
        },
      },
      {
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      },
    )
    return true
  } catch (error) {
    console.error("Brevo email error:", error)
    return false
  }
}

export interface RegistrationEmailData {
  eventTitle: string
  eventDate: string
  clubName: string
  venue: string
  studentName: string
  qrCodeDataUrl?: string
  onlineLink?: string
}

export function generateRegistrationEmailHTML(data: RegistrationEmailData): string {
  const eventDateTime = new Date(data.eventDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; }
          .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; margin: 10px 0; }
          .detail-label { font-weight: bold; width: 120px; color: #667eea; }
          .qr-section { text-align: center; margin: 30px 0; }
          .qr-image { max-width: 200px; margin: 20px auto; }
          .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Registration Confirmed!</h1>
            <p>You're all set for ${data.eventTitle}</p>
          </div>
          
          <div class="content">
            <p>Hello ${data.studentName},</p>
            
            <p>Thank you for registering for <strong>${data.eventTitle}</strong>. We're excited to have you at our event!</p>
            
            <div class="event-details">
              <h2 style="color: #667eea; margin-top: 0;">Event Details</h2>
              <div class="detail-row">
                <span class="detail-label">Event:</span>
                <span>${data.eventTitle}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date & Time:</span>
                <span>${eventDateTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Organizer:</span>
                <span>${data.clubName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Location:</span>
                <span>${data.onlineLink ? `Online - ${data.onlineLink}` : data.venue}</span>
              </div>
            </div>
            
            ${
              data.qrCodeDataUrl
                ? `
            <div class="qr-section">
              <h3 style="color: #667eea;">Your Attendance QR Code</h3>
              <p>Show this QR code at the event for attendance marking:</p>
              <div class="qr-image">
                <img src="${data.qrCodeDataUrl}" alt="Event QR Code" style="border: 2px solid #667eea; border-radius: 8px;">
              </div>
              <p style="font-size: 12px; color: #666;">Save this email for quick access to your QR code</p>
            </div>
            `
                : ""
            }
            
            <p style="background: #e8f4f8; padding: 15px; border-radius: 5px; border-left: 4px solid #667eea;">
              <strong>Important:</strong> Make sure to bring a valid ID and arrive 10 minutes before the event starts.
            </p>
            
            <p>If you have any questions or need to cancel, please contact us at info@eventportal.com.</p>
          </div>
          
          <div class="footer">
            <p>&copy; 2026 College Event Portal. All rights reserved.</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `
}
