const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const user = context.clientContext && context.clientContext.user;

  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Acceso no autorizado. No se encontró información del usuario.' }),
    };
  }

  const userId = user.sub;

  try {
    const clasesPromise = supabase.from('clases').select('*');
    const reservasPromise = supabase.from('reservas').select('clase_id');
    const misReservasPromise = supabase.from('reservas').select('clase_id').eq('alumno_id', userId);

    const [clasesResult, reservasResult, misReservasResult] = await Promise.all([
      clasesPromise,
      reservasPromise,
      misReservasPromise
    ]);

    if (clasesResult.error) throw clasesResult.error;
    if (reservasResult.error) throw reservasResult.error;
    if (misReservasResult.error) throw misReservasResult.error;

    const reservasCount = {};
    for (const reserva of reservasResult.data) {
      reservasCount[reserva.clase_id] = (reservasCount[reserva.clase_id] || 0) + 1;
    }
    
    const misReservasSet = new Set(misReservasResult.data.map(r => r.clase_id));

    const scheduleData = clasesResult.data.map(clase => {
      const anotados = reservasCount[clase.id] || 0;
      return {
        id: clase.id,
        nombre: clase.nombre,
        dia_semana: clase.dia_semana,
        hora: clase.hora.substring(0, 5),
        anotados: anotados,
        disponibles: clase.cupo_maximo - anotados,
        isBookedByUser: misReservasSet.has(clase.id)
      };
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      body: JSON.stringify(scheduleData),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};