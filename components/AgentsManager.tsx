// components/AgentsManager.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Agent {
  id: string;
  email: string;
  createdAt: Date;
}

interface Props {
  agents: Agent[];
}

export default function AgentsManager({ agents }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      alert("Por favor ingresa un email válido");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setEmail("");
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.message || "Error al añadir agente");
      }
    } catch (error) {
      console.error("Error adding agent:", error);
      alert("Error al añadir agente");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`¿Está seguro de que desea eliminar el agente ${email}?`))
      return;

    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.message || "Error al eliminar agente");
      }
    } catch (error) {
      console.error("Error deleting agent:", error);
      alert("Error al eliminar agente");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Add Agent Form */}
      <div className="md:col-span-1">
        <form
          onSubmit={handleAdd}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4">Añadir Nuevo Agente</h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email del Agente
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="agente@empresa.com"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? "Añadiendo..." : "Añadir Agente"}
          </button>
          <p className="mt-3 text-xs text-gray-500">
            Los usuarios con este email tendrán permisos de agente al iniciar
            sesión.
          </p>
        </form>
      </div>

      {/* Agents List */}
      <div className="md:col-span-2">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="text-xl font-semibold text-gray-700">
              Lista de Agentes ({agents.length})
            </h2>
          </div>

          {agents.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No hay agentes registrados en el sistema.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Fecha de Registro
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr
                      key={agent.id}
                      className="bg-white border-b hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {agent.email}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(agent.createdAt).toLocaleDateString("es-ES")}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDelete(agent.id, agent.email)}
                          className="font-medium text-red-600 hover:underline"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
