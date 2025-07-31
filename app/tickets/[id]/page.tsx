import { currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { syncUser } from '@/lib/sync-user'
import Header from '@/components/Header'
import TicketDetail from '@/components/TicketDetail'
import { TicketWithRelations } from '@/types'

interface Props {
  params: {
    id: string
  }
}

export default async function TicketDetailPage({ params }: Props) {
  const clerkUser = await currentUser()
  
  if (!clerkUser) {
    redirect('/sign-in')
  }

  const user = await syncUser(clerkUser)

  const ticketRaw = await prisma.ticket.findUnique({
    where: {
      id: params.id
    },
    include: {
      createdBy: true,
      assignedTo: true,
      equipment: true,
      conversations: {
        include: {
          author: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      }
    }
  })

  if (!ticketRaw) {
    redirect('/dashboard')
  }

  if (user.role === 'USER' && ticketRaw.createdById !== user.id) {
    redirect('/dashboard')
  }

  const ticket: TicketWithRelations = {
    ...ticketRaw,
    attachments: Array.isArray(ticketRaw.attachments) 
      ? ticketRaw.attachments as string[]
      : ticketRaw.attachments 
        ? [ticketRaw.attachments as string]
        : null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <main className="container mx-auto p-6">
        <TicketDetail ticket={ticket} currentUser={user} />
      </main>
    </div>
  )
}
