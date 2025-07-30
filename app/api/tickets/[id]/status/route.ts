// app/api/tickets/[id]/status/route.ts
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

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await syncUser(clerkUser);

    if (user.role !== "AGENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    if (!["OPEN", "IN_PROGRESS", "CLOSED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        createdBy: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Actualizar estado
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    // Preparar mensaje según el estado
    let statusMessage = "";
    switch (status) {
      case "IN_PROGRESS":
        statusMessage = `Su ticket está ahora en progreso y siendo atendido por ${user.name}.`;
        break;
      case "CLOSED":
        statusMessage = `Su ticket ha sido cerrado. Si el problema persiste, puede crear un nuevo ticket.`;
        break;
      case "OPEN":
        statusMessage = `Su ticket ha sido reabierto y está pendiente de asignación.`;
        break;
    }

    // Notificar por email
    const ticketUrl = `${
      process.env.NEXT_PUBLIC_BASE_URL || "https://soporteequiposv.vercel.app"
    }/tickets/${ticket.id}`;
    const emailRecipients = [ticket.contactEmail];

    if (ticket.createdBy.email !== ticket.contactEmail) {
      emailRecipients.push(ticket.createdBy.email);
    }

    const statusText =
      status === "OPEN"
        ? "Abierto"
        : status === "IN_PROGRESS"
        ? "En Progreso"
        : "Cerrado";

    await sendEmail({
      to: emailRecipients,
      subject: `Ticket ${ticket.id} - Estado cambiado a ${statusText}`,
      htmlContent: generateTicketEmailTemplate(
        ticket.id,
        ticket.subject,
        statusMessage,
        user.name,
        ticketUrl
      ),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating ticket status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
