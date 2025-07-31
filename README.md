# 🛠️ Sistema de Soporte

Sistema de mesa de ayuda y soporte técnico construido con Next.js 14, diseñado para gestionar tickets de soporte de equipos tecnológicos con funcionalidades avanzadas de comunicación y gestión.

## 🌟 Características Principales

### 👥 **Gestión de Usuarios**

- **Autenticación completa** con Clerk (registro, login, perfiles)
- **Roles diferenciados**: Usuarios y Agentes con permisos específicos
- **Sincronización automática** entre Clerk y base de datos local

### 🎫 **Sistema de Tickets**

- **Creación de tickets** vinculados a equipos registrados
- **Estados de ticket**: Abierto, En Progreso, Cerrado
- **Asignación automática** y manual de agentes
- **Historial completo** de conversaciones
- **Archivos adjuntos** con compresión automática de imágenes

### 📎 **Gestión de Archivos**

- **Compresión inteligente** de imágenes (máx. 1400px, conservando proporciones)
- **Límite de tamaño**: 4MB por archivo
- **Formatos soportados**: JPG, JPEG, PNG, PDF
- **Almacenamiento seguro** en Vercel Blob Storage
- **Adjuntos en conversaciones** y tickets iniciales

### 📧 **Sistema de Notificaciones**

- **Emails automáticos** para todas las interacciones
- **Templates HTML** profesionales y responsivos
- **Notificaciones en tiempo real** vía SMTP

### 🔧 **Gestión de Equipos y Agentes**

- **Registro de equipos** con número de serie único
- **Validación de equipos** antes de crear tickets
- **Gestión de agentes** (añadir/eliminar permisos)
- **Protecciones de seguridad** (no auto-eliminación)

### 🔒 **Seguridad y Validación**

- **reCAPTCHA v2** en formularios públicos
- **Validación de roles** en todas las operaciones
- **Sanitización de archivos** y nombres
- **Middleware de autenticación** en todas las rutas protegidas

## 🏗️ Arquitectura del Sistema

### **Stack Tecnológico**

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Backend**: Next.js API Routes, Prisma ORM
- **Base de Datos**: SQL (compatible con PlanetScale, Railway, etc.)
- **Autenticación**: Clerk
- **Almacenamiento**: Vercel Blob Storage
- **Email**: SMTP (Brevo/SendinBlue compatible)
- **Estilos**: Tailwind CSS
- **Validación**: reCAPTCHA v2

### **Estructura de la Base de Datos**

```sql
-- Usuarios del sistema
users (id, clerkId, email, name, role, createdAt, updatedAt)

-- Agentes autorizados
agents (id, email, createdAt)

-- Equipos registrados
equipments (id, serial, name, createdAt, updatedAt)

-- Tickets de soporte
tickets (id, subject, details, contactPhone, contactEmail, status,
         attachments, createdAt, updatedAt, createdById, assignedToId, equipmentId)

-- Conversaciones en tickets
conversations (id, message, attachments, isAI, createdAt, ticketId, authorId)
```

### **Flujo de Trabajo**

1. **Usuario registra** cuenta y es sincronizado automáticamente
2. **Usuario crea ticket** seleccionando equipo por número de serie
3. **Sistema valida** equipo y procesa archivos adjuntos
4. **Notificaciones automáticas** a todos los agentes (BCC)
5. **Agente toma** el ticket y cambia estado a "En Progreso"
6. **Conversación bidireccional** con archivos adjuntos
7. **Cierre del ticket** con notificación final

## 🚀 Instalación y Configuración

### **Prerrequisitos**

- Node.js 18+
- Base de datos SQL
- Cuenta de Clerk
- Cuenta de Brevo/SendinBlue (para emails)
- Cuenta de Vercel (para Blob Storage)
- reCAPTCHA keys de Google

### **Instalación Local**

```bash
# Clonar el repositorio
git clone [URL_DEL_REPO]
cd vichada-support-system

# Instalar dependencias
npm install
# o
pnpm install

# Configurar variables de entorno (ver sección siguiente)
cp .env.example .env.local

# Configurar base de datos
npx prisma db push
npx prisma generate

# Ejecutar en desarrollo
npm run dev
# o
pnpm dev
```

## 🔐 Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# ===========================================
# BASE DE DATOS
# ===========================================
DATABASE_URL="mysql://usuario:password@host:3306/nombre_base_datos"
SHADOW_DATABASE_URL="mysql://usuario:password@host:3306/nombre_base_datos_shadow"

# ===========================================
# AUTENTICACIÓN CLERK
# ===========================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="CLERK_PUBLISHABLE_KEY_EJEMPLO"
CLERK_SECRET_KEY="CLERK_SECRET_KEY_EJEMPLO"

# ===========================================
# RECAPTCHA (Google)
# ===========================================
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="RECAPTCHA_SITE_KEY_EJEMPLO"
RECAPTCHA_SECRET_KEY="RECAPTCHA_SECRET_KEY_EJEMPLO"

# ===========================================
# VERCEL BLOB STORAGE
# ===========================================
BLOB_READ_WRITE_TOKEN="VERCEL_BLOB_TOKEN_EJEMPLO"

# ===========================================
# EMAIL SMTP (Brevo)
# ===========================================
BREVO_API_KEY="BREVO_API_KEY_EJEMPLO"
BREVO_SMTP_SERVER="smtp-relay.brevo.com"
BREVO_SMTP_PORT="587"
BREVO_SMTP_USER="usuario@smtp-brevo.com"
BREVO_SMTP_PASS="CLAVE_SMTP_EJEMPLO"

# Configuración del remitente
SENDER_NAME="Nombre del Remitente"
SENDER_EMAIL="correo@miorganizacion.com"

# ===========================================
# URL BASE (para links en emails)
# ===========================================
NEXT_PUBLIC_BASE_URL="https://mi-app.vercel.app"
```

### **Obtener las Claves Necesarias**

#### **1. Clerk (Autenticación)**

1. Ir a [clerk.com](https://clerk.com)
2. Crear aplicación
3. Copiar las claves desde el dashboard

#### **2. reCAPTCHA (Google)**

1. Ir a [Google reCAPTCHA](https://www.google.com/recaptcha)
2. Registrar sitio (tipo reCAPTCHA v2)
3. Copiar site key y secret key

#### **3. Brevo (Email)**

1. Crear cuenta en [Brevo](https://www.brevo.com)
2. Ir a SMTP & API → SMTP
3. Generar nueva clave SMTP

#### **4. Vercel Blob Storage**

1. En Vercel Dashboard → Storage
2. Crear Blob Store
3. Copiar el token de lectura/escritura

## 🚀 Despliegue en Producción

### **Vercel (Recomendado)**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel

# Configurar variables de entorno en Vercel Dashboard
# o usar CLI:
vercel env add VARIABLE_NAME
```

### **Variables de Entorno en Vercel**

1. Ir a Project Settings → Environment Variables
2. Agregar todas las variables del `.env.local`
3. Configurar para Production, Preview y Development

### **Base de Datos en Producción**

Opciones recomendadas:

- **PlanetScale**: MySQL sin servidor
- **Railway**: PostgreSQL/MySQL
- **Supabase**: PostgreSQL
- **Neon**: PostgreSQL sin servidor

### **Configuración Post-Despliegue**

```bash
# Configurar base de datos en producción
npx prisma db push

# Verificar conexión
npx prisma studio
```

## 👨‍💼 Configuración Inicial de Agentes

### **Crear Primer Agente**

```sql
-- Conectar a tu base de datos y ejecutar:
INSERT INTO agents (id, email, createdAt)
VALUES ('agent1', 'tu-email@empresa.com', NOW());
```

O usar Prisma Studio:

```bash
npx prisma studio
# Ir a la tabla 'agents' y agregar registros
```

### **Flujo de Permisos**

1. **Usuario normal** se registra → rol: `USER`
2. **Email agregado** a tabla `agents` → próximo login será `AGENT`
3. **Agentes pueden** gestionar equipos y otros agentes
4. **Usuarios pueden** solo crear y ver sus tickets

## 📁 Estructura del Proyecto

```
├── app/
│   ├── api/                 # API Routes
│   │   ├── agents/          # Gestión de agentes
│   │   ├── equipment/       # Gestión de equipos
│   │   ├── tickets/         # CRUD de tickets
│   │   └── upload/          # Subida de archivos
│   ├── agents/              # Página de gestión de agentes
│   ├── dashboard/           # Panel principal
│   ├── equipment/           # Gestión de equipos
│   ├── tickets/             # Páginas de tickets
│   └── (auth)/              # Páginas de autenticación
├── components/              # Componentes React reutilizables
├── lib/                     # Utilidades y configuraciones
│   ├── email.ts             # Sistema de emails
│   ├── image-compression.ts # Compresión de imágenes
│   ├── prisma.ts            # Cliente de Prisma
│   └── sync-user.ts         # Sincronización de usuarios
├── prisma/
│   └── schema.prisma        # Esquema de base de datos
└── types/
    └── index.ts             # Tipos TypeScript
```

## 🧪 Testing y Desarrollo

### **Scripts Disponibles**

```bash
# Desarrollo
pnpm dev

# Build de producción
pnpm build

# Iniciar producción
pnpm start

# Linting
pnpm lint

# Base de datos
pnpm db:push      # Aplicar cambios de schema
pnpm db:studio    # Abrir Prisma Studio
```

### **Testing de Funcionalidades**

1. **Crear cuenta de usuario**
2. **Registrar equipos** (como agente)
3. **Crear ticket** con archivos adjuntos
4. **Responder como agente** con archivos
5. **Verificar emails** en todas las etapas
6. **Probar gestión** de agentes

## 🔧 Personalización

### **Cambiar Límites de Archivos**

```typescript
// lib/image-compression.ts
export const MAX_FILE_SIZE = 4 * 1024 * 1024; // Cambiar aquí

// app/api/upload/route.ts - También actualizar aquí
```

### **Modificar Compresión de Imágenes**

```typescript
// lib/image-compression.ts
export function compressImage(
  file: File,
  maxWidth: number = 1400, // Cambiar resolución máxima
  quality: number = 0.8 // Cambiar calidad (0.1 - 1.0)
);
```

### **Personalizar Templates de Email**

```typescript
// lib/email.ts - Función generateTicketEmailTemplate
// Modificar HTML y estilos según necesidades
```

## 🐛 Troubleshooting

### **Problemas Comunes**

#### **Error de Base de Datos**

```bash
# Regenerar cliente Prisma
npx prisma generate

# Resetear base de datos (CUIDADO: borra datos)
npx prisma db push --force-reset
```

#### **Error de Clerk**

- Verificar que las URLs de redirección estén configuradas
- Confirmar que las claves sean del ambiente correcto (test/prod)

#### **Emails no llegan**

- Verificar configuración SMTP en Brevo
- Confirmar que `NEXT_PUBLIC_BASE_URL` esté configurada
- Revisar logs de la consola para errores

#### **Archivos no se suben**

- Verificar token de Vercel Blob
- Confirmar límites de tamaño
- Revisar formatos permitidos

## 📞 Soporte

Para reportar bugs o solicitar features:

1. Crear issue en el repositorio
2. Incluir logs de error
3. Describir pasos para reproducir
4. Especificar entorno (desarrollo/producción)

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver archivo `LICENSE` para más detalles.

---

**Desarrollado con ❤️ por [MahooBox](https://www.mahoobox.com) para mejorar la gestión de soporte técnico**
