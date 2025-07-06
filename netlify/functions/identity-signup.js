const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { user } = JSON.parse(event.body);

  const { data, error } = await supabase
    .from('alumnos')
    .insert([
      { id: user.id, email: user.email, nombre: user.user_metadata.full_name || user.email }
    ]);

  if (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  return { statusCode: 200, body: JSON.stringify({ message: 'Alumno creado en Supabase.' }) };
};