import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { syncUser } from '@/lib/sync-user'
import { sendEmail, generateTicketEmailTemplate } from '@/lib/email'

interface Params {
  params: {
    id: string
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await syncUser(clerkUser)
    
    if (user.role !== 'AGENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    if (!['OPEN', 'IN_PROGRESS', 'CLOSED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        createdBy: true,
        equipment: true
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status,
        updatedAt: new Date()
      }
    })

    let statusMessage = ''
    let actionType: 'updated' | 'closed' = 'updated'

    switch (status) {
      case 'IN_PROGRESS':
        statusMessage = `Su ticket está ahora en progreso y siendo atendido por ${user.name}.`
        break
      case 'CLOSED':
        statusMessage = `Su ticket ha sido cerrado por ${user.name}. Si el problema persiste o tiene nuevas consultas, puede crear un nuevo ticket.`
        actionType = 'closed'
        break
      case 'OPEN':
        statusMessage = `Su ticket ha sido reabierto por ${user.name} y está pendiente de asignación.`
        break
    }

    // Enviar emails SOLO si la variable base URL está configurada
    if (process.env.NEXT_PUBLIC_BASE_URL) {
      const ticketUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/tickets/${ticket.id}`
      
      const userEmails = [ticket.contactEmail]
      if (ticket.createdBy.email !== ticket.contactEmail) {
        userEmails.push(ticket.createdBy.email)
      }

      const agents = await prisma.agent.findMany({
        where: {
          email: {
            not: user.email
          }
        },
        select: { email: true }
      })
      const otherAgentEmails = agents.map(agent => agent.email)

      const allEmails = [...userEmails, ...otherAgentEmails]
      const statusText = status === 'OPEN' ? 'Abierto' : status === 'IN_PROGRESS' ? 'En Progreso' : 'Cerrado'

      try {
        if (allEmails.length > 0) {
          await sendEmail({
            to: allEmails,
            subject: `Ticket ${ticket.id} - Estado cambiado a ${statusText}`,
            htmlContent: generateTicketEmailTemplate(
              ticket.id,
              ticket.subject,
              statusMessage,
              user.name,
              ticketUrl,
              actionType
            )
          })
          console.log('✅ Status change notification email sent for ticket:', ticket.id)
        }
      } catch (emailError) {
        console.error('❌ Error sending status change notification:', emailError)
      }
    } else {
      console.warn('NEXT_PUBLIC_BASE_URL not configured - skipping email notification')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating ticket status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
