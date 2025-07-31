// types/index.ts
export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  role: "USER" | "AGENT";
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  email: string;
  createdAt: Date;
}

export interface Equipment {
  id: string;
  serial: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ticket {
  id: string;
  subject: string;
  details: string;
  contactPhone: string;
  contactEmail: string;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
  attachments: any;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  assignedToId?: string | null;
  equipmentId: string;
}

export interface Conversation {
  id: string;
  message: string;
  attachments?: any; // JsonValue from Prisma
  isAI: boolean;
  createdAt: Date;
  ticketId: string;
  authorId: string;
}

export interface TicketWithRelations extends Omit<Ticket, "attachments"> {
  attachments: string[] | null;
  createdBy: User;
  assignedTo?: User | null;
  equipment: Equipment;
  conversations: (Conversation & {
    author: User;
  })[];
}

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";
export type UserRole = "USER" | "AGENT";
