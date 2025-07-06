
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Usar la service key para tener privilegios de admin
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { alumnoId } = JSON.parse(event.body);

  if (!alumnoId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'ID de alumno es obligatorio.' }) };
  }

  try {
    // 1. Eliminar el alumno de la tabla 'alumnos'
    const { error: deleteTableError } = await supabase
      .from('alumnos')
      .delete()
      .eq('id', alumnoId);

    if (deleteTableError) {
      throw new Error(`Error eliminando alumno de la tabla: ${deleteTableError.message}`);
    }

    // 2. Eliminar el usuario del sistema de autenticación de Supabase
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(alumnoId);

    if (deleteAuthError) {
      // Si falla la eliminación de Auth, es un problema, pero la tabla ya se eliminó.
      // Podríamos loguear esto para revisión manual.
      console.error(`Advertencia: Error eliminando usuario de Auth para ID ${alumnoId}: ${deleteAuthError.message}`);
    }

    return { statusCode: 200, body: JSON.stringify({ message: 'Alumno eliminado con éxito.' }) };

  } catch (error) {
    console.error('Error al eliminar alumno:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
