const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { prompt } = JSON.parse(event.body);

  if (!prompt) {
    return { statusCode: 400, body: 'Prompt is required' };
  }
  
  try {
    const chatCompletion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "Eres un experto en Pilates. Tu tarea es generar rutinas claras y seguras, formateadas en HTML simple. Usa etiquetas <h3> para el título, <p> para párrafos y <ul><li> para las listas de ejercicios.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        model: "llama3-8b-8192",
    });

    const reply = chatCompletion.choices[0]?.message?.content || "No se pudo generar una rutina en este momento.";

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
