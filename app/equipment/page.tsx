// app/equipment/page.tsx
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { syncUser } from "@/lib/sync-user";
import Header from "@/components/Header";
import EquipmentManager from "@/components/EquipmentManager";

export default async function EquipmentPage() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    redirect("/sign-in");
  }

  const user = await syncUser(clerkUser);

  if (user.role !== "AGENT") {
    redirect("/dashboard");
  }

  const equipment = await prisma.equipment.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Gestionar Equipos
        </h1>

        <EquipmentManager equipment={equipment} />
      </main>
    </div>
  );
}
