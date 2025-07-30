// app/tickets/new/page.tsx
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { syncUser } from "@/lib/sync-user";
import Header from "@/components/Header";
import NewTicketForm from "@/components/NewTicketForm";

export default async function NewTicketPage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  const user = await syncUser(clerkUser);

  if (user.role !== "USER") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Crear Nuevo Ticket de Soporte
        </h1>

        <NewTicketForm user={user} />
      </main>
    </div>
  );
}
