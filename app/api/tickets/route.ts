// app/api/tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { syncUser } from "@/lib/sync-user";
import { sendEmail, generateTicketEmailTemplate } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await syncUser(clerkUser);
    if (user.role !== "USER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      subject,
      equipmentSerial,
      details,
      contactPhone,
      contactEmail,
      attachments,
      recaptcha,
    } = body;

    // Validar reCAPTCHA
    const recaptchaResponse = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY!,
          response: recaptcha,
        }),
      }
    );

    const recaptchaData = await recaptchaResponse.json();
    if (!recaptchaData.success) {
      return NextResponse.json(
        { error: "reCAPTCHA validation failed" },
        { status: 400 }
      );
    }

    // Buscar equipo por serial
    const equipment = await prisma.equipment.findFirst({
      where: {
        serial: {
          equals: equipmentSerial,
        },
      },
    });

    if (!equipment) {
      return NextResponse.json(
        { error: "Equipment not found" },
        { status: 400 }
      );
    }

    // Crear ticket
    const ticket = await prisma.ticket.create({
      data: {
        subject,
        details,
        contactPhone,
        contactEmail,
        attachments,
        createdById: user.id,
        equipmentId: equipment.id,
      },
      include: {
        createdBy: true,
        equipment: true,
      },
    });

    // Enviar emails de notificación
    const ticketUrl = `${
      process.env.NEXT_PUBLIC_BASE_URL || "https://soporteequiposv.vercel.app"
    }/tickets/${ticket.id}`;

    // 1. SIEMPRE incluir emails de usuarios
    const userEmails = [contactEmail];
    if (contactEmail !== user.email) {
      userEmails.push(user.email);
    }

    // 2. SIEMPRE incluir TODOS los agentes
    const agents = await prisma.agent.findMany({
      select: { email: true },
    });
    const agentEmails = agents.map((agent) => agent.email);

    // 3. Combinar todos los emails SIN filtrar
    const allEmails = [...new Set([...userEmails, ...agentEmails])];

    console.log(`📧 Sending new ticket notification for ticket ${ticket.id}:`);
    console.log(`   - User emails: ${userEmails.join(", ")}`);
    console.log(`   - Agent emails: ${agentEmails.join(", ")}`);
    console.log(`   - All recipients: ${allEmails.join(", ")}`);
    console.log(`   - Created by: ${user.name} (${user.email})`);

    try {
      if (allEmails.length > 0) {
        let emailMessage = ticket.details;

        // Si hay archivos adjuntos, agregar información al mensaje
        if (attachments && attachments.length > 0) {
          emailMessage += `\n\n[Se han adjuntado ${attachments.length} archivo(s) a este ticket]`;
        }

        await sendEmail({
          to: allEmails,
          subject: `Nuevo Ticket Creado - ${ticket.id}: ${ticket.subject}`,
          htmlContent: generateTicketEmailTemplate(
            ticket.id,
            ticket.subject,
            emailMessage,
            user.name,
            ticketUrl,
            "created"
          ),
        });

        console.log(
          `✅ New ticket notification email sent to ${allEmails.length} recipients`
        );
      }
    } catch (emailError) {
      console.error("❌ Error sending new ticket notification:", emailError);
      // No fallar la creación del ticket por un error de email
    }

    return NextResponse.json({ ticketId: ticket.id });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
