const { createClient } = require('@supabase/supabase-js');

// --- Configuración ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Lista de Alumnos (Extraída del PDF) ---
const alumnos = [
    { nombre: "AYELEN", clases_por_semana: 1 },
    { nombre: "BRENDA", clases_por_semana: 1 },
    { nombre: "CECILIA TORRES", clases_por_semana: 2 },
    { nombre: "DANIEL", clases_por_semana: 2 },
    { nombre: "EMILIA", clases_por_semana: 2 },
    { nombre: "EVELYN", clases_por_semana: 1 },
    { nombre: "FANNY", clases_por_semana: 1 },
    { nombre: "FERNANDA", clases_por_semana: 2 },
    { nombre: "GENIFER BRAVI", clases_por_semana: 2 },
    { nombre: "GISELA CASTRO", clases_por_semana: 2 },
    { nombre: "GISELA CRISTALINI", clases_por_semana: 2 },
    { nombre: "GISELA J", clases_por_semana: 1 },
    { nombre: "GUADALUPE", clases_por_semana: 2 },
    { nombre: "IVANA", clases_por_semana: 2 },
    { nombre: "JULIETA BREVI", clases_por_semana: 2 },
    { nombre: "JULIETA", clases_por_semana: 1 },
    { nombre: "KAREN", clases_por_semana: 2 },
    { nombre: "LUCIANA", clases_por_semana: 2 },
    { nombre: "MARCIA", clases_por_semana: 1 },
    { nombre: "MARGARITA", clases_por_semana: 1 },
    { nombre: "MARIA", clases_por_semana: 2 },
    { nombre: "MARISABEL", clases_por_semana: 2 },
    { nombre: "OMAR", clases_por_semana: 2 },
    { nombre: "PATRICIA", clases_por_semana: 2 },
    { nombre: "SERGIO", clases_por_semana: 2 },
    { nombre: "SOFIA", clases_por_semana: 2 },
    { nombre: "THIANA", clases_por_semana: 2 }
];

// --- Función para generar datos de usuario ---
function crearDatosUsuario(nombre) {
  const nombreFormateado = nombre.toLowerCase().replace(/\s+/g, '.');
  const email = `${nombreFormateado}@contrology.ficticio`;
  const password = Math.random().toString(36).slice(-12); 
  return { email, password, nombre };
}

// --- Función Principal de Carga ---
async function cargarAlumnos() {
  console.log('Iniciando carga masiva de alumnos...');

  for (const alumno of alumnos) {
    const { email, password, nombre: fullName } = crearDatosUsuario(alumno.nombre);

    try {
      // 1. Crear el usuario en el sistema de autenticación de Supabase
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      });

      if (authError) {
        throw new Error(`Error creando usuario en Auth para ${fullName}: ${authError.message}`);
      }

      console.log(`Usuario creado en Auth para: ${fullName}`);
      const user = authData.user;

      // 2. Insertar el alumno en la tabla 'alumnos'
      const { error: tableError } = await supabase
        .from('alumnos')
        .insert([{ 
            id: user.id, 
            email: user.email, 
            nombre: fullName, 
            clases_por_semana: alumno.clases_por_semana 
        }]);

      if (tableError) {
        await supabase.auth.admin.deleteUser(user.id);
        throw new Error(`Error insertando en tabla para ${fullName}: ${tableError.message}`);
      }

      console.log(`-> Alumno ${fullName} procesado correctamente.`);
      console.log(`   Email: ${email}, Contraseña: ${password}`);

    } catch (error) {
      console.error(error.message);
    }
  }

  console.log('Carga masiva finalizada.');
}

// --- Ejecutar la función ---
cargarAlumnos();