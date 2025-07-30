// components/TicketList.tsx
import Link from "next/link";

interface TicketWithRelations {
  id: string;
  subject: string;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    name: string;
  };
  assignedTo?: {
    name: string;
  } | null;
  equipment: {
    name: string;
    serial: string;
  };
}

interface Props {
  tickets: TicketWithRelations[];
  userRole: "USER" | "AGENT";
}

export default function TicketList({ tickets, userRole }: Props) {
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

  if (tickets.length === 0) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-8 text-center">
        <p className="text-gray-500 text-lg">No se encontraron tickets.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <h2 className="text-xl font-semibold text-gray-700">
          {userRole === "AGENT" ? "Todos los Tickets" : "Mis Tickets"}
        </h2>
      </div>
      <div className="divide-y divide-gray-200">
        {tickets.map((ticket) => (
          <Link
            key={ticket.id}
            href={`/tickets/${ticket.id}`}
            className="p-4 flex items-center justify-between hover:bg-gray-50 transition duration-150"
          >
            <div className="flex-1">
              <p className="font-semibold text-blue-700">
                {ticket.id} -{" "}
                <span className="text-gray-800">{ticket.subject}</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Equipo: {ticket.equipment.name} ({ticket.equipment.serial})
              </p>
              <p className="text-sm text-gray-500">
                Última actualización:{" "}
                {new Date(ticket.updatedAt).toLocaleString("es-ES")}
                {userRole === "AGENT" && (
                  <>
                    {" | Creado por: "}
                    {ticket.createdBy.name}
                    {ticket.assignedTo && (
                      <> | Asignado a: {ticket.assignedTo.name}</>
                    )}
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusClass(
                  ticket.status
                )}`}
              >
                {getStatusText(ticket.status)}
              </span>
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
