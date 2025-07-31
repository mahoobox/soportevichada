// lib/email.ts
import nodemailer from "nodemailer";

interface EmailData {
  to: string[];
  subject: string;
  htmlContent: string;
}

export async function sendEmail({ to, subject, htmlContent }: EmailData) {
  console.log("Attempting to send email via SMTP to:", to);
  console.log("Subject:", subject);

  try {
    // Crear transporter con variables de entorno
    const transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_SERVER,
      port: parseInt(process.env.BREVO_SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS,
      },
    });

    const result = await transporter.sendMail({
      from: {
        name: process.env.SENDER_NAME,
        address: process.env.SENDER_EMAIL,
      },
      to: to.join(", "),
      subject,
      html: htmlContent,
    });

    console.log("✅ Email sent successfully via SMTP:", result.messageId);
    return result;
  } catch (error) {
    console.error("❌ Error sending email via SMTP:", error);
    throw error;
  }
}

export function generateTicketEmailTemplate(
  ticketId: string,
  subject: string,
  message: string,
  author: string,
  ticketUrl: string,
  actionType: "created" | "updated" | "assigned" | "closed" = "updated"
) {
  const actionMessages = {
    created: "Se ha creado un nuevo ticket",
    updated: "Se ha añadido una nueva respuesta al ticket",
    assigned: "El ticket ha sido asignado a un agente",
    closed: "El ticket ha sido cerrado",
  };

  const actionColors = {
    created: "#10b981", // green
    updated: "#3b82f6", // blue
    assigned: "#f59e0b", // amber
    closed: "#6b7280", // gray
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>${actionMessages[actionType]} - ${ticketId}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Sistema de Soporte Vichada</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Actualización de Ticket</p>
            </div>
            
            <!-- Status Badge -->
            <div style="text-align: center; padding: 20px 20px 0 20px;">
                <div style="display: inline-block; background-color: ${
                  actionColors[actionType]
                }; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: bold;">
                    ${actionMessages[actionType]}
                </div>
            </div>
            
            <!-- Content -->
            <div style="padding: 20px;">
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid ${
                  actionColors[actionType]
                };">
                    <h2 style="margin-top: 0; color: #1f2937; font-size: 18px;">Ticket ${ticketId}</h2>
                    <h3 style="color: #374151; font-size: 16px; margin: 10px 0;">Asunto: ${subject}</h3>
                    
                    <div style="margin: 15px 0;">
                        <p style="margin: 0; font-weight: bold; color: #4b5563;">Mensaje de: ${author}</p>
                        <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0; border: 1px solid #e5e7eb;">
                            ${message
                              .split("\n")
                              .map(
                                (line) =>
                                  `<p style="margin: 8px 0;">${line}</p>`
                              )
                              .join("")}
                        </div>
                    </div>
                </div>
                
                <!-- Call to Action -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${ticketUrl}" 
                       style="background: ${
                         actionColors[actionType]
                       }; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                        Ver Ticket Completo
                    </a>
                </div>
                
                <!-- Footer Info -->
                <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-top: 20px;">
                    <p style="margin: 0; font-size: 14px; color: #6b7280;">
                        <strong>¿Necesitas ayuda?</strong><br>
                        Responde directamente a este email o accede al sistema usando el enlace de arriba.
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #374151; color: #d1d5db; padding: 20px; text-align: center; font-size: 12px;">
                <p style="margin: 0;">
                    Este es un mensaje automático del Sistema de Soporte Vichada.<br>
                    Para responder, haga clic en el enlace de arriba e inicie sesión en el sistema.
                </p>
                <p style="margin: 10px 0 0 0; opacity: 0.7;">
                    Fecha: ${new Date().toLocaleString("es-ES")}
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
}
