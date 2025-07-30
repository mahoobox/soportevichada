
export enum Role {
  USER = 'user',
  AGENT = 'agent',
}

export enum TicketStatus {
  OPEN = 'Abierto',
  IN_PROGRESS = 'En Progreso',
  CLOSED = 'Cerrado',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Conversation {
  author: string;
  message: string;
  timestamp: string;
  isAI: boolean;
}

export interface Ticket {
  id: string;
  subject: string;
  equipmentSerial: string;
  equipmentName: string;
  details: string;
  contactPhone: string;
  contactEmail: string;
  attachments: string[];
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: User['id'];
  creatorName: string;
  assignedTo?: User['id'];
  assignedAgentName?: string;
  conversationHistory: Conversation[];
}

export interface Equipment {
  id: string;
  serial: string;
  name: string;
}

export interface FileUpload {
  name: string;
  url: string;
}
