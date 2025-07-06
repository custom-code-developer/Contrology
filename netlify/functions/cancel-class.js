const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  if (!context.clientContext || !context.clientContext.user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Acceso no autorizado. Debes iniciar sesión para cancelar.' }) };
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
      return { statusCode: 403, body: JSON.stringify({ error: 'Solo alumnos registrados pueden cancelar clases.' }) };
    }

    // 2. Eliminar la reserva
    const { error } = await supabase
      .from('reservas')
      .delete()
      .match({ clase_id: classId, alumno_id: userId });

    if (error) throw error;
    
    return { statusCode: 200, body: JSON.stringify({ message: 'Cancelación exitosa.' }) };

  } catch (error) {
    console.error('Error en cancel-class:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};