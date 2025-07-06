const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteAllUsersAndAlumnos() {
  console.log('Iniciando eliminación de usuarios y registros de alumnos...');

  try {
    // 1. Eliminar todos los registros de la tabla 'alumnos'
    console.log('Eliminando registros de la tabla alumnos...');
    const { error: deleteAlumnosError } = await supabase
      .from('alumnos')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Elimina todo excepto un ID ficticio para asegurar que la cláusula .delete() se ejecute

    if (deleteAlumnosError) {
      throw new Error(`Error al eliminar registros de la tabla alumnos: ${deleteAlumnosError.message}`);
    }
    console.log('Registros de la tabla alumnos eliminados.');

    // 2. Obtener y eliminar todos los usuarios de autenticación
    console.log('Obteniendo usuarios de autenticación...');
    const { data: { users }, error: listUsersError } = await supabase.auth.admin.listUsers();

    if (listUsersError) {
      throw new Error(`Error al listar usuarios de autenticación: ${listUsersError.message}`);
    }

    if (users.length === 0) {
      console.log('No hay usuarios de autenticación para eliminar.');
    } else {
      console.log(`Eliminando ${users.length} usuarios de autenticación...`);
      for (const user of users) {
        const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteUserError) {
          console.error(`Error al eliminar usuario ${user.id}: ${deleteUserError.message}`);
        } else {
          console.log(`Usuario ${user.id} (${user.email}) eliminado.`);
        }
      }
      console.log('Usuarios de autenticación eliminados.');
    }

    console.log('Proceso de eliminación completado con éxito.');

  } catch (error) {
    console.error('Error en el proceso de eliminación:', error.message);
  }
}

deleteAllUsersAndAlumnos();
