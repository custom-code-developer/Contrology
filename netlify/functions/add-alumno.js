
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Usar la service key para tener privilegios de admin
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { email, nombre, telefono, clasesPorSemana, notas } = JSON.parse(event.body);

  if (!email || !nombre) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Email y Nombre son campos obligatorios.' }) };
  }

  try {
    // 1. Crear el usuario en el sistema de autenticación de Supabase
    // Generar una contraseña temporal para el nuevo usuario
    const tempPassword = Math.random().toString(36).slice(-12);

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true, // Asumimos que la profesora confirma el email
      user_metadata: { full_name: nombre }
    });

    if (authError) {
      throw new Error(`Error creando usuario en Auth para ${nombre}: ${authError.message}`);
    }

    const user = authData.user;

    // 2. Insertar el alumno en la tabla 'alumnos'
    // Aquí incluimos todos los campos adicionales del formulario
    const { data: tableData, error: tableError } = await supabase
      .from('alumnos')
      .insert([
        { 
          id: user.id, 
          email: user.email, 
          nombre: nombre, 
          telefono: telefono, 
          clases_por_semana: clasesPorSemana, 
          notas: notas 
        }
      ]);

    if (tableError) {
      // Si falla la inserción en la tabla, intentar eliminar el usuario de Auth para consistencia
      await supabase.auth.admin.deleteUser(user.id);
      throw new Error(`Error insertando en tabla para ${nombre}: ${tableError.message}`);
    }

    return { statusCode: 200, body: JSON.stringify({ message: 'Alumno añadido con éxito.', userEmail: email, tempPassword: tempPassword }) };

  } catch (error) {
    console.error('Error al añadir alumno:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
