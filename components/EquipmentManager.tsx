// components/EquipmentManager.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Equipment {
  id: string;
  serial: string;
  name: string;
  createdAt: Date;
}

interface Props {
  equipment: Equipment[];
}

export default function EquipmentManager({ equipment }: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    serial: "",
    name: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.serial || !formData.name) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/equipment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ serial: "", name: "" });
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.message || "Error al añadir equipo");
      }
    } catch (error) {
      console.error("Error adding equipment:", error);
      alert("Error al añadir equipo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este equipo?")) return;

    try {
      const response = await fetch(`/api/equipment/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.message || "Error al eliminar equipo");
      }
    } catch (error) {
      console.error("Error deleting equipment:", error);
      alert("Error al eliminar equipo");
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Add Equipment Form */}
      <div className="md:col-span-1">
        <form
          onSubmit={handleAdd}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <h2 className="text-xl font-semibold mb-4">Añadir Nuevo Equipo</h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="serial"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Número de Serie
              </label>
              <input
                type="text"
                id="serial"
                name="serial"
                value={formData.serial}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: HP-LAP-12345"
              />
            </div>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nombre del Equipo
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej: Laptop HP ProBook"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? "Añadiendo..." : "Añadir Equipo"}
          </button>
        </form>
      </div>

      {/* Equipment List */}
      <div className="md:col-span-2">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="text-xl font-semibold text-gray-700">
              Lista de Equipos ({equipment.length})
            </h2>
          </div>

          {equipment.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No hay equipos registrados en el sistema.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                      Serial
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Nombre
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
                  {equipment.map((item) => (
                    <tr
                      key={item.id}
                      className="bg-white border-b hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {item.serial}
                      </td>
                      <td className="px-6 py-4">{item.name}</td>
                      <td className="px-6 py-4">
                        {new Date(item.createdAt).toLocaleDateString("es-ES")}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDelete(item.id)}
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
