import { User as ClerkUser } from '@clerk/nextjs/server'
import { prisma } from './prisma'

export async function syncUser(clerkUser: ClerkUser) {
  const userEmail = clerkUser.emailAddresses[0]?.emailAddress || ''
  
  // Verificar si el usuario es un agente
  const isAgent = await prisma.agent.findUnique({
    where: {
      email: userEmail
    }
  })
  
  const userRole = isAgent ? 'AGENT' : 'USER'

  const existingUser = await prisma.user.findUnique({
    where: {
      clerkId: clerkUser.id
    }
  })

  if (existingUser) {
    // Actualizar información y rol si es necesario
    return await prisma.user.update({
      where: {
        clerkId: clerkUser.id
      },
      data: {
        name: clerkUser.firstName || clerkUser.lastName || 'Usuario',
        email: userEmail,
        role: userRole // Actualizar rol basado en tabla de agentes
      }
    })
  }

  // Crear nuevo usuario
  return await prisma.user.create({
    data: {
      clerkId: clerkUser.id,
      name: clerkUser.firstName || clerkUser.lastName || 'Usuario',
      email: userEmail,
      role: userRole // Asignar rol basado en tabla de agentes
    }
  })
}
