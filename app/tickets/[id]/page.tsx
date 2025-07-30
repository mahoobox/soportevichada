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

export default async function TicketDetailPage({ params }: Props) {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  const user = await syncUser(clerkUser);

  const ticket = await prisma.ticket.findUnique({
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

  if (!ticket) {
    redirect("/dashboard");
  }

  // Verificar que el usuario tenga acceso al ticket
  if (user.role === "USER" && ticket.createdById !== user.id) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="container mx-auto p-6">
        <TicketDetail ticket={ticket} currentUser={user} />
      </main>
    </div>
  );
}
