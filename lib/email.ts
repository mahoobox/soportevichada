// lib/email.ts
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

interface EmailData {
  to: string[];
  subject: string;
  htmlContent: string;
}

export async function sendEmail({ to, subject, htmlContent }: EmailData) {
  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": process.env.BREVO_API_KEY!,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          name: "Soporte Vichada",
          email: "soporte@vichada.com",
        },
        to: to.map((email) => ({ email })),
        subject,
        htmlContent,
      }),
    });

    if (!response.ok) {
      throw new Error(`Email service error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

export function generateTicketEmailTemplate(
  ticketId: string,
  subject: string,
  message: string,
  author: string,
  ticketUrl: string
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Actualización de Ticket - ${ticketId}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Actualización de Ticket - ${ticketId}</h2>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Asunto: ${subject}</h3>
                <p><strong>Mensaje de:</strong> ${author}</p>
                <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0;">
                    ${message
                      .split("\n")
                      .map((line) => `<p>${line}</p>`)
                      .join("")}
                </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${ticketUrl}" 
                   style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Ver Ticket Completo
                </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 14px;">
                Este es un mensaje automático del Sistema de Soporte Vichada.<br>
                Para responder, haga clic en el enlace de arriba e inicie sesión en el sistema.
            </p>
        </div>
    </body>
    </html>
  `;
}
