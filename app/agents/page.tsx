// app/agents/page.tsx
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { syncUser } from "@/lib/sync-user";
import Header from "@/components/Header";
import AgentsManager from "@/components/AgentsManager";

export default async function AgentsPage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  const user = await syncUser(clerkUser);

  if (user.role !== "AGENT") {
    redirect("/dashboard");
  }

  const agents = await prisma.agent.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Gestionar Agentes
        </h1>

        <AgentsManager agents={agents} />
      </main>
    </div>
  );
}
