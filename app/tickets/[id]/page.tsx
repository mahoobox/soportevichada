// app/tickets/[id]/page.tsx
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { syncUser } from "@/lib/sync-user";
import Header from "@/components/Header";
import TicketDetail from "@/components/TicketDetail";

interface Props {
  params: {
    id: string;
  };
}

// Definir tipos locales para evitar conflictos
interface ConversationWithAuthor {
  id: string;
  message: string;
  attachments: string[] | null;
  isAI: boolean;
  createdAt: Date;
  author: {
    name: string;
  };
}

interface TicketWithRelationsLocal {
  id: string;
  subject: string;
  details: string;
  contactPhone: string;
  contactEmail: string;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
  attachments: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name: string;
  };
  assignedTo?: {
    id: string;
    name: string;
  } | null;
  equipment: {
    name: string;
    serial: string;
  };
  conversations: ConversationWithAuthor[];
}

export default async function TicketDetailPage({ params }: Props) {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  const user = await syncUser(clerkUser);

  const ticketRaw = await prisma.ticket.findUnique({
    where: {
      id: params.id,
    },
    include: {
      createdBy: true,
      assignedTo: true,
      equipment: true,
      conversations: {
        include: {
          author: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!ticketRaw) {
    redirect("/dashboard");
  }

  if (user.role === "USER" && ticketRaw.createdById !== user.id) {
    redirect("/dashboard");
  }

  // Transformar los datos para que coincidan con el tipo esperado
  const ticket: TicketWithRelationsLocal = {
    id: ticketRaw.id,
    subject: ticketRaw.subject,
    details: ticketRaw.details,
    contactPhone: ticketRaw.contactPhone,
    contactEmail: ticketRaw.contactEmail,
    status: ticketRaw.status,
    createdAt: ticketRaw.createdAt,
    updatedAt: ticketRaw.updatedAt,
    attachments: Array.isArray(ticketRaw.attachments)
      ? (ticketRaw.attachments as string[])
      : ticketRaw.attachments
      ? [ticketRaw.attachments as string]
      : null,
    createdBy: {
      id: ticketRaw.createdBy.id,
      name: ticketRaw.createdBy.name,
    },
    assignedTo: ticketRaw.assignedTo
      ? {
          id: ticketRaw.assignedTo.id,
          name: ticketRaw.assignedTo.name,
        }
      : null,
    equipment: {
      name: ticketRaw.equipment.name,
      serial: ticketRaw.equipment.serial,
    },
    conversations: ticketRaw.conversations.map((conv) => ({
      id: conv.id,
      message: conv.message,
      attachments: Array.isArray(conv.attachments)
        ? (conv.attachments as string[])
        : conv.attachments
        ? [conv.attachments as string]
        : null,
      isAI: conv.isAI,
      createdAt: conv.createdAt,
      author: {
        name: conv.author.name,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="container mx-auto p-6">
        <TicketDetail ticket={ticket} currentUser={user} />
      </main>
    </div>
  );
}
