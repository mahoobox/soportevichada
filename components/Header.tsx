// components/Header.tsx
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "AGENT";
}

interface Props {
  user: User;
}

export default function Header({ user }: Props) {
  return (
    <header className="bg-white shadow-md">
      <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-bold text-gray-800">
          Soporte Vichada
        </Link>

        <div className="flex items-center space-x-4">
          {user.role === "AGENT" && (
            <div className="flex items-center space-x-4">
              <Link
                href="/equipment"
                className="text-gray-600 hover:text-blue-600 transition"
              >
                Equipos
              </Link>
              <Link
                href="/agents"
                className="text-gray-600 hover:text-blue-600 transition"
              >
                Agentes
              </Link>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <span className="text-gray-700">
              {user.name} ({user.role === "AGENT" ? "Agente" : "Usuario"})
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </nav>
    </header>
  );
}
