// lib/sync-user.ts
import { User as ClerkUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function syncUser(clerkUser: ClerkUser) {
  const existingUser = await prisma.user.findUnique({
    where: {
      clerkId: clerkUser.id,
    },
  });

  if (existingUser) {
    // Actualizar información si es necesario
    return await prisma.user.update({
      where: {
        clerkId: clerkUser.id,
      },
      data: {
        name: clerkUser.fullName || clerkUser.firstName || "Usuario",
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
      },
    });
  }

  // Crear nuevo usuario
  return await prisma.user.create({
    data: {
      clerkId: clerkUser.id,
      name: clerkUser.fullName || clerkUser.firstName || "Usuario",
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      role: "USER", // Por defecto todos son usuarios, los agentes se asignan manualmente en Clerk
    },
  });
}
