// components/NewTicketForm.tsx
"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ReCAPTCHA from "react-google-recaptcha";
import FileUpload from "./FileUpload";

interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "AGENT";
}

interface Props {
  user: User;
}

export default function NewTicketForm({ user }: Props) {
  const router = useRouter();
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const [formData, setFormData] = useState({
    subject: "",
    equipmentSerial: "",
    details: "",
    contactPhone: "",
    contactEmail: user.email,
  });

  const [equipment, setEquipment] = useState<{ name: string } | null>(null);
  const [serialStatus, setSerialStatus] = useState<
    "idle" | "checking" | "found" | "not_found"
  >("idle");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSerialBlur = async () => {
    if (!formData.equipmentSerial) {
      setSerialStatus("idle");
      setEquipment(null);
      return;
    }

    setSerialStatus("checking");

    try {
      const response = await fetch(
        `/api/equipment/check?serial=${encodeURIComponent(
          formData.equipmentSerial
        )}`
      );
      const data = await response.json();

      if (data.found) {
        setEquipment(data.equipment);
        setSerialStatus("found");
      } else {
        setEquipment(null);
        setSerialStatus("not_found");
      }
    } catch (error) {
      console.error("Error checking serial:", error);
      setSerialStatus("not_found");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (serialStatus !== "found") {
      alert("Por favor, ingrese un número de serie de equipo válido.");
      return;
    }

    const recaptchaValue = recaptchaRef.current?.getValue();
    if (!recaptchaValue) {
      alert("Por favor, complete el reCAPTCHA.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Subir archivos si existen
      let attachmentUrls: string[] = [];
      if (attachments.length > 0) {
        const uploadPromises = attachments.map(async (file) => {
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

      // Crear ticket
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          attachments: attachmentUrls,
          recaptcha: recaptchaValue,
        }),
      });

      if (!response.ok) {
        throw new Error("Error creating ticket");
      }

      const { ticketId } = await response.json();

      alert("Ticket creado exitosamente!");
      router.push(`/tickets/${ticketId}`);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear el ticket. Por favor, inténtelo de nuevo.");
    } finally {
      setIsSubmitting(false);
      recaptchaRef.current?.reset();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-8 rounded-lg shadow-lg space-y-6"
    >
      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Asunto de la Solicitud
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label
          htmlFor="equipmentSerial"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Serial del Equipo
        </label>
        <div className="relative">
          <input
            type="text"
            id="equipmentSerial"
            name="equipmentSerial"
            value={formData.equipmentSerial}
            onChange={handleInputChange}
            onBlur={handleSerialBlur}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {serialStatus === "checking" && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
            )}
            {serialStatus === "found" && (
              <svg
                className="w-5 h-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            {serialStatus === "not_found" && (
              <svg
                className="w-5 h-5 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>
        </div>
        {serialStatus === "found" && equipment && (
          <p className="text-sm text-gray-500 mt-1">
            Equipo detectado:{" "}
            <span className="font-semibold">{equipment.name}</span>
          </p>
        )}
        {serialStatus === "not_found" && (
          <p className="text-sm text-red-600 mt-1">
            El serial del equipo no fue encontrado en el sistema.
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="details"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Detalle de la Solicitud
        </label>
        <textarea
          id="details"
          name="details"
          value={formData.details}
          onChange={handleInputChange}
          required
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="contactPhone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Teléfono de Contacto
          </label>
          <input
            type="tel"
            id="contactPhone"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label
            htmlFor="contactEmail"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email de Contacto
          </label>
          <input
            type="email"
            id="contactEmail"
            name="contactEmail"
            value={formData.contactEmail}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <FileUpload
        files={attachments}
        onFilesChange={setAttachments}
        maxFiles={5}
        disabled={isSubmitting}
      />

      <div className="flex justify-center">
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
        />
      </div>

      <div className="flex justify-end pt-4 space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={serialStatus !== "found" || isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition flex items-center"
        >
          {isSubmitting && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          )}
          {isSubmitting ? "Enviando..." : "Crear Ticket"}
        </button>
      </div>
    </form>
  );
}
