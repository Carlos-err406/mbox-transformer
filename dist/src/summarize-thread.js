import OpenAI from "openai";
export const summarizeThread = async (ai, thread, folder) => {
    const { apiKey, apiUrl, model } = ai;
    const openai = new OpenAI({ baseURL: apiUrl, apiKey });
    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                {
                    role: "system",
                    content: `
                  Eres un resumidor de hilos de correo electrónico que procesa conversaciones de correo electrónico presentadas en formato JSON. Tu tarea es:
                  - Responder SOLO con el párrafo de resumen, sin comentarios ni formatos adicionales
                  - Crear un párrafo único y conciso que capture la información esencial de todo el hilo de correo electrónico
                  - Mantener la claridad mientras se es exhaustivo
                  - Los resúmenes deben estar en español
                  Recuerda: Tu salida debe ser exactamente un párrafo, independientemente de la longitud o complejidad del hilo de correo electrónico. No incluir saludos, firmas ni comentarios sobre el resumen en sí.
          `,
                },
                {
                    role: "user",
                    content: `Summarize the following email thread: 
                    ${JSON.stringify(thread.map((message) => ({
                        ...message,
                        attachments: undefined,
                    })))}`,
                },
            ],
        });
        return response.choices[0].message.content || "";
    }
    catch (e) {
        console.log(`SUMMARY ERRORE: error creating summary for thread ${folder}`, {
            e,
        });
    }
};
