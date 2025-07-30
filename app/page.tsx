// app/page.tsx
import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HomePage() {
  const user = await currentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
          <div className="text-xl font-bold text-gray-800">Soporte Vichada</div>
          <Link
            href="/sign-in"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Iniciar Sesión
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50 p-4">
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-4">
            Sistema de Soporte Vichada
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Bienvenido a nuestro centro de ayuda. Inicie una nueva solicitud o
            consulte el estado de una existente.
          </p>

          <div className="space-y-4">
            <Link
              href="/sign-up"
              className="w-full max-w-sm px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-200 flex items-center justify-center space-x-2 mx-auto"
            >
              <span>Iniciar Nueva Solicitud</span>
            </Link>

            <Link
              href="/sign-in"
              className="w-full max-w-sm px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition duration-200 flex items-center justify-center space-x-2 mx-auto"
            >
              <span>Consultar Estado de Solicitud</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
