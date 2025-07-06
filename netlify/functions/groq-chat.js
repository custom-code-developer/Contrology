const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { userQuery } = JSON.parse(event.body);

  if (!userQuery) {
    return { statusCode: 400, body: 'userQuery is required' };
  }

  const systemPrompt = `
    Eres un asistente virtual para "Contrology", un estudio de Pilates en C.S Río Negro, dirigido por Karem Morales.
    Tu personalidad es profesional, amable y persuasiva, basada en los principios de Dale Carnegie.
    Tu único propósito es responder preguntas sobre el método Pilates y motivar a los usuarios a inscribirse.
    NO respondas a ninguna pregunta que no esté directamente relacionada con Pilates, el estudio, horarios o precios. Si te preguntan sobre otro tema, amablemente redirige la conversación diciendo: "Mi especialidad es ayudarte en tu camino con el Pilates. ¿Tienes alguna consulta sobre nuestras clases o el método?".
    Si preguntan por horarios o costos, invítalos a consultar la agenda en la web y ofrece enviarles la información de pago para asegurar su lugar.
    Mantén las respuestas concisas y claras.
  `;

  try {
    const chatCompletion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: systemPrompt,
            },
            {
                role: "user",
                content: userQuery,
            },
        ],
        model: "llama3-8b-8192",
    });

    const reply = chatCompletion.choices[0]?.message?.content || "No he podido procesar tu solicitud en este momento. Por favor, intenta de nuevo.";

    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply }),
    };

  } catch (error) {
    console.error("Groq API error:", error);
    return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Error al comunicarse con el asistente de IA.' }),
    };
  }
};
