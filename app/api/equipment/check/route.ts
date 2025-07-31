import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const serial = searchParams.get('serial')

    if (!serial) {
      return NextResponse.json({ error: 'Serial is required' }, { status: 400 })
    }

    // Búsqueda SIN mode: "insensitive" para MySQL
    const equipment = await prisma.equipment.findFirst({
      where: {
        serial: serial
      }
    })

    if (equipment) {
      return NextResponse.json({
        found: true,
        equipment: {
          id: equipment.id,
          name: equipment.name,
          serial: equipment.serial
        }
      })
    } else {
      return NextResponse.json({
        found: false,
        equipment: null
      })
    }
  } catch (error) {
    console.error('Error checking equipment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
