// app/dashboard/page.tsx
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { syncUser } from "@/lib/sync-user";
import Header from "@/components/Header";
import TicketList from "@/components/TicketList";
import Link from "next/link";

export default async function DashboardPage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  // Sincronizar usuario con la base de datos
  const user = await syncUser(clerkUser);

  // Obtener tickets según el rol
  const tickets =
    user.role === "AGENT"
      ? await prisma.ticket.findMany({
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
          orderBy: {
            updatedAt: "desc",
          },
        })
      : await prisma.ticket.findMany({
          where: {
            createdById: user.id,
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
          orderBy: {
            updatedAt: "desc",
          },
        });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Panel de {user.role === "AGENT" ? "Agente" : "Usuario"}
          </h1>

          <div className="flex gap-4">
            {user.role === "USER" && (
              <Link
                href="/tickets/new"
                className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition"
              >
                + Nuevo Ticket
              </Link>
            )}

            {user.role === "AGENT" && (
              <Link
                href="/equipment"
                className="px-5 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 transition"
              >
                Gestionar Equipos
              </Link>
            )}
          </div>
        </div>

        <TicketList tickets={tickets} userRole={user.role} />
      </main>
    </div>
  );
}
