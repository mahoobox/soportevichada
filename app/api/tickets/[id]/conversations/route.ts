// app/api/tickets/[id]/conversations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { syncUser } from "@/lib/sync-user";
import { sendEmail, generateTicketEmailTemplate } from "@/lib/email";

interface Params {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await syncUser(clerkUser);
    const body = await request.json();
    const { message } = body;

    // Verificar que el ticket existe y el usuario tiene acceso
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        createdBy: true,
        assignedTo: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Verificar permisos
    const hasAccess = user.role === "AGENT" || ticket.createdById === user.id;
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Crear conversación
    const conversation = await prisma.conversation.create({
      data: {
        message,
        isAI: false,
        ticketId: ticket.id,
        authorId: user.id,
      },
    });

    // Actualizar ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        updatedAt: new Date(),
        // Si es un agente respondiendo y el ticket está abierto, cambiar a en progreso
        status:
          user.role === "AGENT" && ticket.status === "OPEN"
            ? "IN_PROGRESS"
            : ticket.status,
        // Si es un agente y el ticket no tiene asignado, asignarlo automáticamente
        assignedToId:
          user.role === "AGENT" && !ticket.assignedToId
            ? user.id
            : ticket.assignedToId,
      },
    });

    // Preparar emails
    const ticketUrl = `${
      process.env.NEXT_PUBLIC_BASE_URL || "https://soporteequiposv.vercel.app"
    }/tickets/${ticket.id}`;
    const emailRecipients = [ticket.contactEmail];

    // Añadir email del creador si es diferente al contactEmail
    if (ticket.createdBy.email !== ticket.contactEmail) {
      emailRecipients.push(ticket.createdBy.email);
    }

    // Si el que responde no es el creador, añadir su email también
    if (
      user.id !== ticket.createdById &&
      !emailRecipients.includes(user.email)
    ) {
      emailRecipients.push(user.email);
    }

    // Enviar notificación por email
    await sendEmail({
      to: emailRecipients,
      subject: `Respuesta en Ticket ${ticket.id} - ${ticket.subject}`,
      htmlContent: generateTicketEmailTemplate(
        ticket.id,
        ticket.subject,
        message,
        user.name,
        ticketUrl
      ),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding conversation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
