// app/api/agents/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { syncUser } from "@/lib/sync-user";

export async function POST(request: NextRequest) {
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
    const { email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Email válido es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el email no exista
    const existingAgent = await prisma.agent.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingAgent) {
      return NextResponse.json(
        { error: "Este email ya está registrado como agente" },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.create({
      data: {
        email: email.toLowerCase(),
      },
    });

    return NextResponse.json(agent);
  } catch (error) {
    console.error("Error creating agent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
