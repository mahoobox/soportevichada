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
    const { message, attachments } = body;

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        createdBy: true,
        assignedTo: true,
        equipment: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const hasAccess = user.role === "AGENT" || ticket.createdById === user.id;
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const conversation = await prisma.conversation.create({
      data: {
        message: message || "",
        attachments: attachments || null,
        isAI: false,
        ticketId: ticket.id,
        authorId: user.id,
      },
    });

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        updatedAt: new Date(),
        status:
          user.role === "AGENT" && ticket.status === "OPEN"
            ? "IN_PROGRESS"
            : ticket.status,
        assignedToId:
          user.role === "AGENT" && !ticket.assignedToId
            ? user.id
            : ticket.assignedToId,
      },
    });

    // Enviar emails SOLO si la variable base URL está configurada
    if (process.env.NEXT_PUBLIC_BASE_URL) {
      const ticketUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/tickets/${ticket.id}`;

      const userEmails = [ticket.contactEmail];
      if (ticket.createdBy.email !== ticket.contactEmail) {
        userEmails.push(ticket.createdBy.email);
      }

      const agents = await prisma.agent.findMany({
        select: { email: true },
      });
      const agentEmails = agents.map((agent) => agent.email);

      const allEmails = [...new Set([...userEmails, ...agentEmails])];
      const recipientEmails = allEmails.filter((email) => email !== user.email);

      try {
        if (recipientEmails.length > 0) {
          let emailMessage = message || "";

          // Si hay archivos adjuntos, agregar información al mensaje
          if (attachments && attachments.length > 0) {
            emailMessage += `\n\n[Se han adjuntado ${attachments.length} archivo(s) a esta respuesta]`;
          }

          await sendEmail({
            to: recipientEmails,
            subject: `Respuesta en Ticket ${ticket.id}: ${ticket.subject}`,
            htmlContent: generateTicketEmailTemplate(
              ticket.id,
              ticket.subject,
              emailMessage,
              user.name,
              ticketUrl,
              "updated"
            ),
          });
          console.log(
            "✅ Notification email sent for ticket response:",
            ticket.id
          );
        }
      } catch (emailError) {
        console.error("❌ Error sending notification email:", emailError);
      }
    } else {
      console.warn(
        "NEXT_PUBLIC_BASE_URL not configured - skipping email notification"
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding conversation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
