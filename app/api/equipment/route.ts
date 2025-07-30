// app/api/equipment/route.ts
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
    const { serial, name } = body;

    if (!serial || !name) {
      return NextResponse.json(
        { error: "Serial and name are required" },
        { status: 400 }
      );
    }

    // Verificar que el serial no exista
    const existingEquipment = await prisma.equipment.findUnique({
      where: { serial },
    });

    if (existingEquipment) {
      return NextResponse.json(
        { error: "Serial already exists" },
        { status: 400 }
      );
    }

    const equipment = await prisma.equipment.create({
      data: {
        serial,
        name,
      },
    });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error("Error creating equipment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
