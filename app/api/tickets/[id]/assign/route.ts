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

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await syncUser(clerkUser)
    
    if (user.role !== 'AGENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
        assignedToId: user.id,
        status: 'IN_PROGRESS',
        updatedAt: new Date()
      }
    })

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

      try {
        if (allEmails.length > 0) {
          await sendEmail({
            to: allEmails,
            subject: `Ticket ${ticket.id} asignado a ${user.name}`,
            htmlContent: generateTicketEmailTemplate(
              ticket.id,
              ticket.subject,
              `Su ticket ha sido asignado al agente ${user.name} y está siendo revisado. El agente se pondrá en contacto con usted pronto.`,
              'Sistema',
              ticketUrl,
              'assigned'
            )
          })
          console.log('✅ Assignment notification email sent for ticket:', ticket.id)
        }
      } catch (emailError) {
        console.error('❌ Error sending assignment notification:', emailError)
      }
    } else {
      console.warn('NEXT_PUBLIC_BASE_URL not configured - skipping email notification')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error assigning ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
