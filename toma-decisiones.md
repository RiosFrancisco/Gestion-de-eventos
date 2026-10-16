## Decisiones de diseño del proyecto

# 1. Elección de la base de datos
El sistema necesita manejar varias entidades relacionadas entre sí.
Se consideraron:
- PostgreSQL.
- MySQL.
Elegimos PostgreSQL porque permite representar correctamente las relaciones entre las entidades y aplicar restricciones.
MySQL también habría servido para usar en el proyecto, pero Postgre resulta más conveniente pensando en futuras operaciones que necesitan integridad y transacciones, como inscripciones y pagos.
Beneficios:
- claves foráneas;
- restricciones;
- transacciones;
- integridad referencial.
Costo:
- requiere diseñar previamente las relaciones y estructura de tablas;
- cambios importantes pueden requerir migraciones.

# 2. Uso de pg
Se consideraron:
- pg;
- Prisma;
- Sequelize.
Elegimos pg porque permite trabajar directamente con SQL y tener mayor control sobre las consultas.
Además, permite usar consultas parametrizadas como $1, $2, etc.
Beneficios:
- mayor control;
- SQL más visible;
- consultas parametrizadas;
- menor nivel de abstracción.
Costo:
- requiere escribir más SQL manualmente.

# 3. Arquitectura en capas
Elegimos organizar el backend de esta forma:
Route
-> Middleware
-> Controller
-> Service
-> Repository
-> PostgreSQL
Esto permite separar responsabilidades y evitar mezclar autenticación, reglas de negocio, HTTP y acceso a datos.
Beneficios:
- mejor organización;
- facilita mantenimiento;
- facilita pruebas;
- permite localizar errores con mayor facilidad.
Costo:
- aumenta la cantidad de archivos.

# 4. Uso de TypeScript e interfaces
Elegimos TypeScript para definir claramente la estructura de los datos. 
En JavaScript estos errores normalmente aparecerían durante la ejecución. TypeScript puede detectar muchos de ellos durante el desarrollo.
Beneficios:
- mejor tipado;
- detección temprana de errores;
- mayor claridad en el código.
Costo:
- requiere mantener tipos e interfaces.

# 5. Uso de Zod
Consideramos:
- validaciones manuales;
- Express Validator;
- Zod.
Elegimos Zod porque permite definir validaciones de forma clara, reutilizable (usando "partial") y compatible con TypeScript.
Beneficios:
- validaciones centralizadas;
- menos repetición;
- mensajes de error controlados;
- buena integración con TypeScript.
Costo:
- agrega una dependencia externa.

# 6. Autenticación con JWT
Consideramos:
- sesiones tradicionales;
- JWT.
Elegimos JWT porque se adapta bien a una API REST y permite identificar al usuario mediante datos como id y rol_id.
Beneficios:
- no requiere guardar sesiones en memoria;
- funciona bien con frontend y backend separados;
- facilita proteger rutas.
Costo:
- si cambia el rol, el token anterior sigue teniendo el rol viejo hasta volver a iniciar sesión.

# 7. Middleware de autenticación y roles
Decidimos centralizar la autenticación y validación de roles en middlewares para evitar repetir lógica en cada controller.
Ejemplo:
validarRol(ROLES.CREADOR, ROLES.ADMIN)
Beneficios:
- menos repetición;
- controllers más simples;
- permisos generales centralizados.
Costo:
- las reglas específicas siguen teniendo que validarse en el Service.

# 8. Uso de PATCH para actualizaciones
Se consideraron:
- PUT;
- PATCH.
Elegimos PATCH porque permite modificar solo los campos necesarios.
Ejemplo:
{
  "nombre": "Nuevo nombre"
}
Para esto se reutiliza el modelo de creación mediante Partial.
Beneficios:
- requests más pequeñas;
- no obliga a reenviar todo el evento;
- evita sobrescribir datos innecesariamente.
Costo:
- el UPDATE debe manejar campos dinámicos.

# 9. Uso de mapEvento()
pg puede devolver ciertos valores numéricos como strings.
Para no repetir conversiones en cada función se creó mapEvento().
Beneficios:
- menos código repetido;
- conversiones centralizadas;
- repositories más limpios.
Costo:
- agrega una pequeña función auxiliar.

# 10. Notas adicionales
- El sistema de pagos se implementará al final del proyecto.
- Noticias y propuestas gastronómicas fueron eliminadas del alcance.
- Los tests se incorporarán al cerrar cada módulo importante, comenzando por eventos.