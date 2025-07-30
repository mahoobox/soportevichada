// app/api/equipment/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs";
import { prisma } from "@/lib/prisma";
import { syncUser } from "@/lib/sync-user";

interface Params {
  params: {
    id: string;
  };
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await syncUser(clerkUser);

    if (user.role !== "AGENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verificar si el equipo tiene tickets asociados
    const ticketsCount = await prisma.ticket.count({
      where: {
        equipmentId: params.id,
      },
    });

    if (ticketsCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete equipment with associated tickets",
        },
        { status: 400 }
      );
    }

    await prisma.equipment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting equipment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
