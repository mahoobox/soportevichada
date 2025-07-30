
import { GoogleGenAI } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";
import type { Ticket, Conversation } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Gemini API calls will be mocked.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MOCK_RESPONSE = `Claro, aquí tienes una sugerencia de respuesta:

**Asunto:** Re: {subject}

**Cuerpo:**
Hola,

Gracias por contactar con el soporte técnico de Vichada. Entiendo que estás experimentando un problema con tu equipo.

Para poder ayudarte mejor, ¿podrías por favor proporcionar un poco más de detalle sobre el error que estás viendo? ¿Aparece algún mensaje en pantalla?

Quedo a la espera de tu respuesta para poder continuar con el diagnóstico.

Saludos cordiales,
Agente de Soporte`;

export const getAIResponseSuggestion = async (ticket: Ticket): Promise<string> => {
  if (!process.env.API_KEY) {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_RESPONSE.replace('{subject}', ticket.subject)), 1000));
  }
  
  const lastUserMessage = ticket.conversationHistory
    .slice()
    .reverse()
    .find(c => c.author !== 'Agente' && !c.isAI)?.message || ticket.details;

  const prompt = `
    Eres un agente de soporte técnico experto para la empresa "Vichada". Tu tono debe ser profesional, empático y claro.
    Un usuario ha enviado el siguiente ticket de soporte. Genera una respuesta sugerida para que un agente humano la revise y envíe.
    La respuesta debe solicitar más información si es necesario o proponer un primer paso de diagnóstico. No asumas que tienes toda la información.

    **Asunto del Ticket:** ${ticket.subject}
    **Detalles del Ticket:** ${lastUserMessage}
    **Equipo:** ${ticket.equipmentName} (${ticket.equipmentSerial})

    Genera una respuesta apropiada. No incluyas saludos genéricos como "Estimado agente", solo la respuesta para el cliente final.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
         thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Lo siento, ha ocurrido un error al generar la sugerencia. Por favor, inténtalo de nuevo.";
  }
};
