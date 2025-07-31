// components/TicketDetail.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FileUpload from "./FileUpload";
import { PaperClipIcon } from "./Icons";

interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "AGENT";
}

interface Conversation {
  id: string;
  message: string;
  attachments: string[] | null;
  isAI: boolean;
  createdAt: Date;
  author: {
    name: string;
  };
}

interface TicketWithRelations {
  id: string;
  subject: string;
  details: string;
  contactPhone: string;
  contactEmail: string;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
  attachments: string[] | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name: string;
  };
  assignedTo?: {
    id: string;
    name: string;
  } | null;
  equipment: {
    name: string;
    serial: string;
  };
  conversations: Conversation[];
}

interface Props {
  ticket: TicketWithRelations;
  currentUser: User;
}

export default function TicketDetail({ ticket, currentUser }: Props) {
  const router = useRouter();
  const [newMessage, setNewMessage] = useState("");
  const [messageAttachments, setMessageAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAgent = currentUser.role === "AGENT";

  const getStatusClass = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "OPEN":
        return "Abierto";
      case "IN_PROGRESS":
        return "En Progreso";
      case "CLOSED":
        return "Cerrado";
      default:
        return status;
    }
  };

  const handleAssign = async () => {
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/assign`, {
        method: "POST",
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error assigning ticket:", error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && messageAttachments.length === 0) return;

    setIsSubmitting(true);

    try {
      // Subir archivos si existen
      let attachmentUrls: string[] = [];
      if (messageAttachments.length > 0) {
        const uploadPromises = messageAttachments.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) throw new Error("Error uploading file");

          const { url } = await response.json();
          return url;
        });

        attachmentUrls = await Promise.all(uploadPromises);
      }

      const response = await fetch(`/api/tickets/${ticket.id}/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: newMessage,
          attachments: attachmentUrls.length > 0 ? attachmentUrls : null,
          isAI: false,
        }),
      });

      if (response.ok) {
        setNewMessage("");
        setMessageAttachments([]);
        router.refresh();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error al enviar el mensaje");
    } finally {
      setIsSubmitting(false);
    }
  };

  const attachments = ticket.attachments || [];

  const renderAttachments = (urls: string[] | null) => {
    if (!urls || urls.length === 0) return null;

    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {urls.map((url, index) => (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md hover:bg-blue-100 transition"
          >
            <PaperClipIcon className="w-3 h-3 mr-1" />
            Archivo {index + 1}
          </a>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <header className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {ticket.subject}
            </h1>
            <p className="text-gray-500">Ticket ID: {ticket.id}</p>
          </div>
          <span
            className={`px-4 py-2 text-sm font-bold rounded-full ${getStatusClass(
              ticket.status
            )}`}
          >
            {getStatusText(ticket.status)}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
          <div>
            <strong>Creado por:</strong> {ticket.createdBy.name}
          </div>
          <div>
            <strong>Fecha:</strong>{" "}
            {new Date(ticket.createdAt).toLocaleDateString("es-ES")}
          </div>
          <div>
            <strong>Equipo:</strong> {ticket.equipment.name}
          </div>
          <div>
            <strong>Serial:</strong> {ticket.equipment.serial}
          </div>
          <div>
            <strong>Teléfono:</strong> {ticket.contactPhone}
          </div>
          <div>
            <strong>Email:</strong> {ticket.contactEmail}
          </div>
          <div>
            <strong>Asignado a:</strong>{" "}
            {ticket.assignedTo?.name || "Sin asignar"}
          </div>
        </div>

        {attachments.length > 0 && (
          <div className="mt-4">
            <strong className="text-sm text-gray-600">
              Archivos adjuntos del ticket:
            </strong>
            {renderAttachments(attachments)}
          </div>
        )}
      </header>

      {/* Conversation History */}
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">
          Historial de Conversación
        </h2>
        <div className="space-y-6">
          {/* Initial message */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
              {ticket.createdBy.name.charAt(0)}
            </div>
            <div className="max-w-xl p-4 rounded-lg bg-gray-100 text-gray-800">
              <p className="font-bold">{ticket.createdBy.name}</p>
              <p className="whitespace-pre-wrap">{ticket.details}</p>
              {renderAttachments(attachments)}
              <p className="text-xs text-gray-500 mt-2 text-right">
                {new Date(ticket.createdAt).toLocaleString("es-ES")}
              </p>
            </div>
          </div>

          {/* Conversation messages */}
          {ticket.conversations.map((conversation) => {
            const isCurrentUser = conversation.author.name === currentUser.name;
            return (
              <div
                key={conversation.id}
                className={`flex items-start gap-4 ${
                  isCurrentUser ? "justify-end" : ""
                }`}
              >
                {!isCurrentUser && (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                    {conversation.author.name.charAt(0)}
                  </div>
                )}
                <div
                  className={`max-w-xl p-4 rounded-lg ${
                    isCurrentUser
                      ? "bg-blue-100 text-gray-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="font-bold">{conversation.author.name}</p>
                  <p className="whitespace-pre-wrap">{conversation.message}</p>
                  {renderAttachments(conversation.attachments)}
                  <p className="text-xs text-gray-500 mt-2 text-right">
                    {new Date(conversation.createdAt).toLocaleString("es-ES")}
                  </p>
                </div>
                {isCurrentUser && (
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white">
                    {conversation.author.name.charAt(0)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Response Section */}
      {ticket.status !== "CLOSED" && (
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Responder
          </h2>

          <div className="space-y-4">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={5}
              className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Escribe tu respuesta aquí..."
            />

            <FileUpload
              files={messageAttachments}
              onFilesChange={setMessageAttachments}
              maxFiles={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="mt-4 flex flex-wrap justify-between items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={handleSendMessage}
                disabled={
                  isSubmitting ||
                  (!newMessage.trim() && messageAttachments.length === 0)
                }
                className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Enviando..." : "Enviar Mensaje"}
              </button>

              {isAgent && !ticket.assignedTo && (
                <button
                  onClick={handleAssign}
                  className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700"
                >
                  Tomar Ticket
                </button>
              )}
            </div>

            {isAgent && (
              <div className="flex gap-2">
                {ticket.status !== "IN_PROGRESS" && (
                  <button
                    onClick={() => handleStatusChange("IN_PROGRESS")}
                    className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-md hover:bg-yellow-600"
                  >
                    Marcar en Progreso
                  </button>
                )}
                <button
                  onClick={() => handleStatusChange("CLOSED")}
                  className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-md hover:bg-gray-800"
                >
                  Cerrar Ticket
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
