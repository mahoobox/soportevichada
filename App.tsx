
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import type { User, Role, TicketStatus, Ticket, Equipment, Conversation, FileUpload } from './types';
import { Role as RoleEnum, TicketStatus as TicketStatusEnum } from './types';
import { getAIResponseSuggestion } from './services/geminiService';
import { UserCircleIcon, WrenchScrewdriverIcon, ArrowRightIcon, SparklesIcon, CheckCircleIcon, XCircleIcon, PaperClipIcon, Spinner } from './components/Icons';

// MOCK DATA & API
const MOCK_USERS: User[] = [
    { id: 'user-1', name: 'Usuario de Prueba', email: 'usuario@test.com', role: RoleEnum.USER },
    { id: 'agent-1', name: 'Agente Ana', email: 'agente.ana@vichada.com', role: RoleEnum.AGENT },
    { id: 'agent-2', name: 'Agente Beto', email: 'agente.beto@vichada.com', role: RoleEnum.AGENT },
];

const MOCK_EQUIPMENT: Equipment[] = [
    { id: 'eq-1', serial: 'HP-LAP-12345', name: 'Laptop HP ProBook' },
    { id: 'eq-2', serial: 'DELL-DESK-67890', name: 'Desktop Dell OptiPlex' },
    { id: 'eq-3', serial: 'LEN-MON-54321', name: 'Monitor Lenovo ThinkVision' },
];

const MOCK_TICKETS: Ticket[] = [
    {
        id: 'TKT-001',
        subject: 'La pantalla no enciende',
        equipmentSerial: 'LEN-MON-54321',
        equipmentName: 'Monitor Lenovo ThinkVision',
        details: 'He intentado conectar el monitor a diferentes fuentes de poder pero la pantalla permanece en negro. No muestra ni el logo.',
        contactPhone: '3101234567',
        contactEmail: 'cliente@ejemplo.com',
        attachments: [],
        status: TicketStatusEnum.IN_PROGRESS,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: 'user-1',
        creatorName: 'Usuario de Prueba',
        assignedTo: 'agent-1',
        assignedAgentName: 'Agente Ana',
        conversationHistory: [
            { author: 'Usuario de Prueba', message: 'He intentado conectar el monitor a diferentes fuentes de poder pero la pantalla permanece en negro. No muestra ni el logo.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), isAI: false },
            { author: 'Agente Ana', message: 'Hola, gracias por reportar. ¿Ha verificado si el cable de video (HDMI/DisplayPort) está correctamente conectado tanto al monitor como al computador?', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), isAI: false },
        ]
    },
    {
        id: 'TKT-002',
        subject: 'El sistema operativo está muy lento',
        equipmentSerial: 'HP-LAP-12345',
        equipmentName: 'Laptop HP ProBook',
        details: 'Desde la última actualización, el computador tarda mucho en iniciar y abrir programas.',
        contactPhone: '3209876543',
        contactEmail: 'usuario@test.com',
        attachments: [],
        status: TicketStatusEnum.OPEN,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: 'user-1',
        creatorName: 'Usuario de Prueba',
        conversationHistory: [
            { author: 'Usuario de Prueba', message: 'Desde la última actualización, el computador tarda mucho en iniciar y abrir programas.', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), isAI: false }
        ]
    },
];

// --- COMPONENTS (defined outside App to avoid re-renders) ---

const Header: React.FC<{ user: User | null; onLogout: () => void }> = ({ user, onLogout }) => (
    <header className="bg-white shadow-md">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
            <Link to="/" className="text-xl font-bold text-gray-800">
                Soporte Vichada
            </Link>
            <div className="flex items-center space-x-4">
                {user && user.role === RoleEnum.AGENT && (
                    <Link to="/equipment" className="text-gray-600 hover:text-blue-600">
                        Equipos
                    </Link>
                )}
                {user ? (
                    <>
                        <span className="text-gray-700">{user.name} ({user.role})</span>
                        <button onClick={onLogout} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition">
                            Cerrar Sesión
                        </button>
                    </>
                ) : (
                    <Link to="/" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                        Iniciar Sesión
                    </Link>
                )}
            </div>
        </nav>
    </header>
);

const LoginPage: React.FC<{ onLogin: (role: Role) => void }> = ({ onLogin }) => {
    const navigate = useNavigate();
    
    const handleLogin = (role: Role) => {
        onLogin(role);
        navigate('/dashboard');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] bg-gray-50 p-4">
            <div className="text-center max-w-2xl">
                <h1 className="text-4xl font-extrabold text-gray-800 mb-4">Sistema de Soporte Vichada</h1>
                <p className="text-lg text-gray-600 mb-8">
                    Bienvenido a nuestro centro de ayuda. Inicie una nueva solicitud o consulte el estado de una existente.
                </p>
                <div className="space-y-4">
                    <button onClick={() => handleLogin(RoleEnum.USER)} className="w-full max-w-sm px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-200 flex items-center justify-center space-x-2">
                        <UserCircleIcon className="w-6 h-6" />
                        <span>Iniciar como Usuario / Crear Ticket</span>
                    </button>
                    <button onClick={() => handleLogin(RoleEnum.AGENT)} className="w-full max-w-sm px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 transition duration-200 flex items-center justify-center space-x-2">
                        <WrenchScrewdriverIcon className="w-6 h-6" />
                        <span>Iniciar como Agente</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const DashboardPage: React.FC<{ user: User, tickets: Ticket[] }> = ({ user, tickets }) => {
    const navigate = useNavigate();

    const myTickets = useMemo(() => {
        if (user.role === RoleEnum.AGENT) return tickets;
        return tickets.filter(t => t.createdBy === user.id);
    }, [user, tickets]);
    
    const sortedTickets = useMemo(() => {
        return [...myTickets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }, [myTickets]);

    const getStatusClass = (status: TicketStatus) => {
        switch (status) {
            case TicketStatusEnum.OPEN: return 'bg-green-100 text-green-800';
            case TicketStatusEnum.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800';
            case TicketStatusEnum.CLOSED: return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Panel de {user.role === RoleEnum.AGENT ? 'Agente' : 'Usuario'}</h1>
                {user.role === RoleEnum.USER && (
                    <button onClick={() => navigate('/new-ticket')} className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition">
                        + Nuevo Ticket
                    </button>
                )}
            </div>

            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                    <h2 className="text-xl font-semibold text-gray-700">
                        {user.role === RoleEnum.AGENT ? 'Todos los Tickets' : 'Mis Tickets'}
                    </h2>
                </div>
                <div className="divide-y divide-gray-200">
                    {sortedTickets.length === 0 ? (
                        <p className="p-6 text-gray-500">No se encontraron tickets.</p>
                    ) : (
                        sortedTickets.map(ticket => (
                            <Link to={`/ticket/${ticket.id}`} key={ticket.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition duration-150">
                                <div>
                                    <p className="font-semibold text-blue-700">{ticket.id} - <span className="text-gray-800">{ticket.subject}</span></p>
                                    <p className="text-sm text-gray-500">
                                        Última actualización: {new Date(ticket.updatedAt).toLocaleString()}
                                        {user.role === RoleEnum.AGENT && ` | Creado por: ${ticket.creatorName}`}
                                    </p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusClass(ticket.status)}`}>
                                        {ticket.status}
                                    </span>
                                    <ArrowRightIcon className="w-5 h-5 text-gray-400" />
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const NewTicketPage: React.FC<{
    user: User;
    onCreateTicket: (ticketData: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'conversationHistory' | 'creatorName'>) => void;
    onCheckSerial: (serial: string) => Promise<Equipment | null>;
}> = ({ user, onCreateTicket, onCheckSerial }) => {
    const navigate = useNavigate();
    const [subject, setSubject] = useState('');
    const [serial, setSerial] = useState('');
    const [details, setDetails] = useState('');
    const [phone, setPhone] =useState('');
    const [email, setEmail] = useState(user.email);
    const [attachments, setAttachments] = useState<FileUpload[]>([]);
    
    const [equipmentName, setEquipmentName] = useState<string | null>(null);
    const [serialStatus, setSerialStatus] = useState<'idle' | 'checking' | 'found' | 'not_found'>('idle');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleSerialCheck = useCallback(async (currentSerial: string) => {
        if (!currentSerial) {
            setSerialStatus('idle');
            setEquipmentName(null);
            return;
        }
        setSerialStatus('checking');
        const equipment = await onCheckSerial(currentSerial);
        if (equipment) {
            setEquipmentName(equipment.name);
            setSerialStatus('found');
        } else {
            setEquipmentName(null);
            setSerialStatus('not_found');
        }
    }, [onCheckSerial]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).slice(0, 5 - attachments.length).map(file => ({
                name: file.name,
                url: `blob_mock_url/${file.name}` // Mocking blob URL
            }));
            setAttachments(prev => [...prev, ...newFiles]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (serialStatus !== 'found' || isSubmitting) {
            alert('Por favor, ingrese un número de serie de equipo válido.');
            return;
        }
        setIsSubmitting(true);
        console.log("Simulating reCAPTCHA validation...");

        const newTicketData = {
            subject,
            equipmentSerial: serial,
            equipmentName: equipmentName || 'N/A',
            details,
            contactPhone: phone,
            contactEmail: email,
            attachments: attachments.map(f => f.url),
            createdBy: user.id
        };
        
        onCreateTicket(newTicketData);
        alert("Ticket creado exitosamente!");
        navigate('/dashboard');
    };
    
    return (
         <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Crear Nuevo Ticket de Soporte</h1>
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg space-y-6">
                <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Asunto de la Solicitud</label>
                    <input type="text" id="subject" value={subject} onChange={e => setSubject(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                
                <div>
                    <label htmlFor="serial" className="block text-sm font-medium text-gray-700 mb-1">Serial del Equipo</label>
                    <div className="relative">
                        <input type="text" id="serial" value={serial} onChange={e => setSerial(e.target.value)} onBlur={e => handleSerialCheck(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                         <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            {serialStatus === 'checking' && <Spinner className="w-5 h-5 text-gray-400" />}
                            {serialStatus === 'found' && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
                            {serialStatus === 'not_found' && <XCircleIcon className="w-5 h-5 text-red-500" />}
                        </div>
                    </div>
                    {serialStatus === 'found' && equipmentName && <p className="text-sm text-gray-500 mt-1">Equipo detectado: <span className="font-semibold">{equipmentName}</span></p>}
                    {serialStatus === 'not_found' && <p className="text-sm text-red-600 mt-1">El serial del equipo no fue encontrado en el sistema.</p>}
                </div>
                
                <div>
                    <label htmlFor="details" className="block text-sm font-medium text-gray-700 mb-1">Detalle de la Solicitud</label>
                    <textarea id="details" value={details} onChange={e => setDetails(e.target.value)} required rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono de Contacto</label>
                        <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email de Contacto</label>
                        <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adjuntar Archivos (Opcional, hasta 5)</label>
                    <p className="text-xs text-gray-500 mb-2">Formatos aceptados: .jpg, .jpeg, .png, .pdf</p>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                             <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            <div className="flex text-sm text-gray-600">
                                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                    <span>Subir un archivo</span>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} disabled={attachments.length >= 5} />
                                </label>
                                <p className="pl-1">o arrastrar y soltar</p>
                            </div>
                        </div>
                    </div>
                     {attachments.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {attachments.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                                    <div className="flex items-center space-x-2">
                                        <PaperClipIcon className="w-5 h-5 text-gray-500" />
                                        <span className="text-sm text-gray-800">{file.name}</span>
                                    </div>
                                    <button type="button" onClick={() => setAttachments(attachments.filter((_, i) => i !== index))} className="text-red-500 hover:text-red-700">
                                        <XCircleIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-4">
                    <button type="button" onClick={() => navigate(-1)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 mr-4 transition">Cancelar</button>
                    <button type="submit" disabled={serialStatus !== 'found' || isSubmitting} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition flex items-center">
                        {isSubmitting && <Spinner className="w-5 h-5 mr-2" />}
                        {isSubmitting ? 'Enviando...' : 'Crear Ticket'}
                    </button>
                </div>
            </form>
        </div>
    );
};


const TicketDetailPage: React.FC<{
    user: User;
    tickets: Ticket[];
    onUpdate: (ticketId: string, updates: Partial<Ticket>) => void;
    onAddResponse: (ticketId: string, response: Conversation) => void;
}> = ({ user, tickets, onUpdate, onAddResponse }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const ticket = tickets.find(t => t.id === id);

    const [newMessage, setNewMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);

    if (!ticket) {
        return <div className="text-center p-10">Ticket no encontrado. <Link to="/dashboard" className="text-blue-600">Volver al panel</Link></div>;
    }

    const isAgent = user.role === RoleEnum.AGENT;

    const handleAssign = () => {
        onUpdate(ticket.id, { assignedTo: user.id, assignedAgentName: user.name, status: TicketStatusEnum.IN_PROGRESS });
        console.log(`Email notification: Ticket ${ticket.id} assigned to ${user.name}`);
    };
    
    const handleStatusChange = (newStatus: TicketStatus) => {
        onUpdate(ticket.id, { status: newStatus });
        console.log(`Email notification: Ticket ${ticket.id} status changed to ${newStatus}`);
    };

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        setIsSubmitting(true);
        const response: Conversation = {
            author: isAgent ? user.name : user.name,
            message: newMessage,
            timestamp: new Date().toISOString(),
            isAI: false
        };
        onAddResponse(ticket.id, response);
        
        console.log(`Email notification sent to ${ticket.contactEmail} and ${user.email} for ticket ${ticket.id}`);
        console.log(`Link: ${window.location.href}`);

        setNewMessage('');
        setIsSubmitting(false);
    };

    const handleGetAISuggestion = async () => {
        setIsLoadingAI(true);
        setAiSuggestion(null);
        const suggestion = await getAIResponseSuggestion(ticket);
        setAiSuggestion(suggestion);
        setIsLoadingAI(false);
    };

    const getStatusClass = (status: TicketStatus) => {
        switch (status) {
            case TicketStatusEnum.OPEN: return 'bg-green-100 text-green-800';
            case TicketStatusEnum.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800';
            case TicketStatusEnum.CLOSED: return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    return (
        <div className="container mx-auto p-6">
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <header className="p-6 bg-gray-50 border-b border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{ticket.subject}</h1>
                            <p className="text-gray-500">Ticket ID: {ticket.id}</p>
                        </div>
                        <span className={`px-4 py-2 text-sm font-bold rounded-full ${getStatusClass(ticket.status)}`}>{ticket.status}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div><strong>Creado por:</strong> {ticket.creatorName}</div>
                        <div><strong>Fecha:</strong> {new Date(ticket.createdAt).toLocaleDateString()}</div>
                        <div><strong>Equipo:</strong> {ticket.equipmentName}</div>
                        <div><strong>Serial:</strong> {ticket.equipmentSerial}</div>
                        <div><strong>Asignado a:</strong> {ticket.assignedAgentName || 'Sin asignar'}</div>
                    </div>
                </header>
                
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Historial de Conversación</h2>
                    <div className="space-y-6">
                        {ticket.conversationHistory.map((entry, index) => (
                            <div key={index} className={`flex items-start gap-4 ${entry.author === user.name ? 'justify-end' : ''}`}>
                                 {entry.author !== user.name && <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">{entry.author.charAt(0)}</div>}
                                <div className={`max-w-xl p-4 rounded-lg ${entry.author === user.name ? 'bg-blue-100 text-gray-800' : 'bg-gray-100 text-gray-800'}`}>
                                    <p className="font-bold">{entry.author} {entry.isAI && <span className="text-xs font-normal text-purple-600">(Sugerencia IA)</span>}</p>
                                    <p className="whitespace-pre-wrap">{entry.message}</p>
                                    <p className="text-xs text-gray-500 mt-2 text-right">{new Date(entry.timestamp).toLocaleString()}</p>
                                </div>
                                {entry.author === user.name && <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white">{entry.author.charAt(0)}</div>}
                            </div>
                        ))}
                    </div>
                </div>

                {ticket.status !== TicketStatusEnum.CLOSED && (
                     <div className="p-6 bg-gray-50 border-t border-gray-200">
                         <h2 className="text-xl font-semibold mb-4 text-gray-700">Responder</h2>
                         
                         {isAgent && (
                             <div className="mb-4">
                                 <button onClick={handleGetAISuggestion} disabled={isLoadingAI} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-300">
                                     {isLoadingAI ? <Spinner className="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                                     {isLoadingAI ? 'Generando...' : 'Generar Sugerencia con IA'}
                                 </button>
                                 {aiSuggestion && (
                                     <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-md">
                                        <p className="font-semibold text-purple-800">Sugerencia de IA:</p>
                                        <p className="whitespace-pre-wrap text-sm text-gray-700 mt-2">{aiSuggestion}</p>
                                        <button onClick={() => { setNewMessage(aiSuggestion); setAiSuggestion(null); }} className="mt-2 text-sm text-blue-600 font-semibold">Usar esta respuesta</button>
                                     </div>
                                 )}
                             </div>
                         )}

                         <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} rows={5} className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Escribe tu respuesta aquí..."></textarea>
                         <div className="mt-4 flex flex-wrap justify-between items-center gap-4">
                             <div className="flex gap-2">
                                <button onClick={handleSendMessage} disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                                    {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
                                </button>
                                {isAgent && !ticket.assignedTo && <button onClick={handleAssign} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">Tomar Ticket</button>}
                             </div>
                             {isAgent && (
                                <div className="flex gap-2">
                                    {ticket.status !== TicketStatusEnum.IN_PROGRESS && <button onClick={() => handleStatusChange(TicketStatusEnum.IN_PROGRESS)} className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-md hover:bg-yellow-600">Marcar en Progreso</button>}
                                    <button onClick={() => handleStatusChange(TicketStatusEnum.CLOSED)} className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-md hover:bg-gray-800">Cerrar Ticket</button>
                                </div>
                             )}
                         </div>
                     </div>
                )}
            </div>
        </div>
    );
};

const EquipmentPage: React.FC<{
    equipment: Equipment[];
    onAdd: (equip: Omit<Equipment, 'id'>) => void;
    onDelete: (id: string) => void;
}> = ({ equipment, onAdd, onDelete }) => {
    const [serial, setSerial] = useState('');
    const [name, setName] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if(serial && name) {
            onAdd({ serial, name });
            setSerial('');
            setName('');
        }
    };
    
    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestionar Equipos</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <form onSubmit={handleAdd} className="bg-white p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Añadir Nuevo Equipo</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="new-serial" className="block text-sm font-medium text-gray-700 mb-1">Número de Serie</label>
                                <input type="text" id="new-serial" value={serial} onChange={e => setSerial(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                            </div>
                             <div>
                                <label htmlFor="new-name" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Equipo</label>
                                <input type="text" id="new-name" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
                            </div>
                        </div>
                        <button type="submit" className="mt-6 w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Añadir Equipo</button>
                    </form>
                </div>
                <div className="md:col-span-2">
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left text-gray-500">
                             <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Serial</th>
                                    <th scope="col" className="px-6 py-3">Nombre</th>
                                    <th scope="col" className="px-6 py-3">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {equipment.map(item => (
                                    <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{item.serial}</td>
                                        <td className="px-6 py-4">{item.name}</td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => onDelete(item.id)} className="font-medium text-red-600 hover:underline">Eliminar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};


const ProtectedRoute: React.FC<{ user: User | null; children: React.ReactNode }> = ({ user, children }) => {
    const navigate = useNavigate();
    useEffect(() => {
        if (!user) {
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    return user ? <>{children}</> : null;
};


// --- Main App Component ---

export default function App() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
    const [equipment, setEquipment] = useState<Equipment[]>(MOCK_EQUIPMENT);

    const handleLogin = (role: Role) => {
        const user = role === RoleEnum.AGENT 
            ? MOCK_USERS.find(u => u.role === RoleEnum.AGENT) 
            : MOCK_USERS.find(u => u.role === RoleEnum.USER);
        setCurrentUser(user || null);
    };

    const handleLogout = () => setCurrentUser(null);
    
    const findEquipmentBySerial = async (serial: string): Promise<Equipment | null> => {
        // Simulate network delay
        await new Promise(res => setTimeout(res, 500));
        return equipment.find(e => e.serial.toLowerCase() === serial.toLowerCase()) || null;
    };
    
    const createNewTicket = (ticketData: Omit<Ticket, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'conversationHistory' | 'creatorName'>) => {
        if (!currentUser) return;
        const now = new Date().toISOString();
        const newTicket: Ticket = {
            ...ticketData,
            id: `TKT-${String(tickets.length + 1).padStart(3, '0')}`,
            status: TicketStatusEnum.OPEN,
            createdAt: now,
            updatedAt: now,
            creatorName: currentUser.name,
            conversationHistory: [{
                author: currentUser.name,
                message: ticketData.details,
                timestamp: now,
                isAI: false
            }]
        };
        setTickets(prev => [newTicket, ...prev]);
        console.log("Email notification: New ticket created", newTicket.id);
    };
    
    const updateTicket = (ticketId: string, updates: Partial<Ticket>) => {
        setTickets(prev => prev.map(t => 
            t.id === ticketId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
        ));
    };

    const addResponseToTicket = (ticketId: string, response: Conversation) => {
        setTickets(prev => prev.map(t => {
            if (t.id === ticketId) {
                return {
                    ...t,
                    conversationHistory: [...t.conversationHistory, response],
                    updatedAt: new Date().toISOString(),
                    status: (currentUser?.role === RoleEnum.AGENT && t.status === TicketStatusEnum.OPEN) ? TicketStatusEnum.IN_PROGRESS : t.status,
                    assignedTo: (currentUser?.role === RoleEnum.AGENT && !t.assignedTo) ? currentUser.id : t.assignedTo,
                    assignedAgentName: (currentUser?.role === RoleEnum.AGENT && !t.assignedAgentName) ? currentUser.name : t.assignedAgentName
                };
            }
            return t;
        }));
    };

    const addEquipment = (equip: Omit<Equipment, 'id'>) => {
        const newEquip = { ...equip, id: `eq-${Date.now()}`};
        setEquipment(prev => [newEquip, ...prev]);
    }

    const deleteEquipment = (id: string) => {
        setEquipment(prev => prev.filter(e => e.id !== id));
    }
    
    return (
        <HashRouter>
            <div className="bg-gray-100 min-h-screen font-sans">
                <Header user={currentUser} onLogout={handleLogout} />
                <main>
                    <Routes>
                        <Route path="/" element={currentUser ? <DashboardPage user={currentUser} tickets={tickets} /> : <LoginPage onLogin={handleLogin} />} />
                        <Route path="/dashboard" element={<ProtectedRoute user={currentUser}>{currentUser && <DashboardPage user={currentUser} tickets={tickets} />}</ProtectedRoute>} />
                        <Route path="/new-ticket" element={<ProtectedRoute user={currentUser}>{currentUser && currentUser.role === RoleEnum.USER && <NewTicketPage user={currentUser} onCreateTicket={createNewTicket} onCheckSerial={findEquipmentBySerial} />}</ProtectedRoute>} />
                        <Route path="/ticket/:id" element={<ProtectedRoute user={currentUser}>{currentUser && <TicketDetailPage user={currentUser} tickets={tickets} onUpdate={updateTicket} onAddResponse={addResponseToTicket} />}</ProtectedRoute>} />
                        <Route path="/equipment" element={<ProtectedRoute user={currentUser}>{currentUser && currentUser.role === RoleEnum.AGENT && <EquipmentPage equipment={equipment} onAdd={addEquipment} onDelete={deleteEquipment} />}</ProtectedRoute>} />
                    </Routes>
                </main>
            </div>
        </HashRouter>
    );
}
