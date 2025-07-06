const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  if (!context.clientContext || !context.clientContext.user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Acceso no autorizado. Debes iniciar sesión para reservar.' }) };
  }
  
  const { classId } = JSON.parse(event.body);
  const userId = context.clientContext.user.sub; // ID del usuario autenticado

  try {
    // 1. Verificar que el usuario autenticado sea un alumno registrado
    const { data: alumno, error: alumnoError } = await supabase
      .from('alumnos')
      .select('id')
      .eq('id', userId)
      .single();

    if (alumnoError || !alumno) {
      // Si no se encuentra el alumno o hay un error, significa que el usuario no es un alumno registrado
      return { statusCode: 403, body: JSON.stringify({ error: 'Solo alumnos registrados pueden reservar clases.' }) };
    }

    // 2. Obtener información de la clase
    const { data: clase, error: claseError } = await supabase
      .from('clases')
      .select('cupo_maximo')
      .eq('id', classId)
      .single();

    if (claseError) throw claseError;

    // 3. Contar cuántos anotados hay para esta clase
    const { count: anotados, error: countError } = await supabase
      .from('reservas')
      .select('*', { count: 'exact', head: true })
      .eq('clase_id', classId);

    if (countError) throw countError;

    // 4. Verificar si hay cupo disponible
    if (anotados >= clase.cupo_maximo) {
      return { statusCode: 400, body: JSON.stringify({ error: 'La clase ya está completa.' }) };
    }

    // 5. Insertar la reserva
    const { error: insertError } = await supabase
      .from('reservas')
      .insert({ clase_id: classId, alumno_id: userId, fecha_reserva: new Date() });

    if (insertError) throw insertError;

    return { statusCode: 200, body: JSON.stringify({ message: 'Reserva exitosa.' }) };

  } catch (error) {
    console.error('Error en book-class:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};