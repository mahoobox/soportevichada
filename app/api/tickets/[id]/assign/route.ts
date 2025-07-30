// app/api/tickets/[id]/assign/route.ts
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

    if (user.role !== "AGENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    // Asignar ticket al agente
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        assignedToId: user.id,
        status: "IN_PROGRESS",
        updatedAt: new Date(),
      },
    });

    // Notificar por email
    const ticketUrl = `${
      process.env.NEXT_PUBLIC_BASE_URL || "https://soporteequiposv.vercel.app"
    }/tickets/${ticket.id}`;
    const emailRecipients = [ticket.contactEmail];

    if (ticket.createdBy.email !== ticket.contactEmail) {
      emailRecipients.push(ticket.createdBy.email);
    }

    await sendEmail({
      to: emailRecipients,
      subject: `Ticket ${ticket.id} asignado a ${user.name}`,
      htmlContent: generateTicketEmailTemplate(
        ticket.id,
        ticket.subject,
        `Su ticket ha sido asignado al agente ${user.name} y está siendo revisado.`,
        "Sistema",
        ticketUrl
      ),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error assigning ticket:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
