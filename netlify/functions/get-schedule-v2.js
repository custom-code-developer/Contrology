const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async function(event, context) {
  try {
    let userId = null;
    if (context.clientContext && context.clientContext.user) {
      userId = context.clientContext.user.sub;
    }

    let { data: clases, error: clasesError } = await supabase
      .from('clases')
      .select('*')
      .order('dia_semana')
      .order('hora');

    if (clasesError) throw clasesError;

    let { data: allReservas, error: allReservasError } = await supabase
      .from('reservas')
      .select('clase_id, alumno_id'); // Seleccionar también alumno_id para filtrar por usuario

    if (allReservasError) throw allReservasError;

    const reservasCount = {};
    const userReservations = new Set(); // Para almacenar las clases reservadas por el usuario actual

    for (const reserva of allReservas) {
        reservasCount[reserva.clase_id] = (reservasCount[reserva.clase_id] || 0) + 1;
        if (userId && reserva.alumno_id === userId) {
            userReservations.add(reserva.clase_id);
        }
    }
    
    const scheduleData = clases.map(clase => {
        const anotados = reservasCount[clase.id] || 0;
        const isBookedByUser = userReservations.has(clase.id);
        return {
            id: clase.id,
            nombre: clase.nombre,
            dia_semana: clase.dia_semana,
            hora: clase.hora.substring(0, 5),
            anotados: anotados,
            disponibles: clase.cupo_maximo - anotados,
            isBookedByUser: isBookedByUser
        };
    });

    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      },
      body: JSON.stringify(scheduleData),
    };

  } catch (error) {
    console.error("Error en la función get-schedule-v2:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};