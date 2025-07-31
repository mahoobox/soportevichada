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
          //mode: "insensitive",
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

    // Enviar email de notificación
    const ticketUrl = `${
      process.env.NEXT_PUBLIC_BASE_URL || "https://soporteequiposv.vercel.app"
    }/tickets/${ticket.id}`;

    const emailRecipients = [contactEmail];
    if (contactEmail !== user.email) {
      emailRecipients.push(user.email);
    }

    await sendEmail({
      to: emailRecipients,
      subject: `Nuevo Ticket Creado - ${ticket.id}`,
      htmlContent: generateTicketEmailTemplate(
        ticket.id,
        ticket.subject,
        ticket.details,
        user.name,
        ticketUrl
      ),
    });

    return NextResponse.json({ ticketId: ticket.id });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
