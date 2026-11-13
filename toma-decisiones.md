## Decisiones de diseño del proyecto

# Uso de PATCH para actualizaciones
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

# Agregacion de carpeta utils
pg puede devolver ciertos valores numéricos como strings.
Para no repetir conversiones en cada función se creó mapEvento().
Beneficios:
- menos código repetido;
- conversiones centralizadas;
- repositories más limpios.
Costo:
- agrega pequeñas funciones auxiliares.

# Migracion de la base de datos
Se hizo una migracion para agregar un estado de actividades, ya que sin esta, no podiamos cancelar actividades sin eliminarlas.

## Mejoras futuras: 

# Patrones de diseño
A futuro se planea implementar los siguientes patrones de diseño:
- Strategy (comportamiento): Para implementar distintas formas de pago (tarjetas, transferencias, etc) sin llenar el servicio de condicionales.
- Adapter (estructural): Cuando se agregue una pasarela de pagos (api de mercado pago, paypal, etc), esto nos va a permitir aislar la api y los formatos especificos del proveedor detras de una interfaz propia.
- Observer (comportamiento): Cuando se quiera agregar sistema de notificaciones, esto nos ayuda a seguir un protocolo de notificaciones segun el evento ocurrido, por ejemplo, cuando se cancele un evento, tiene que darse aviso a los usuarios registrados para tal evento.


# Manejo centralizado de errores HTTP
Situación actual: los controladores gestionan errores de forma local y algunas respuestas pueden no distinguir suficientemente entre datos inválidos y falta de permisos (por ejemplo, responder 400 en lugar de 403).

Propuesta: incorporar una clase de error de aplicación (por ejemplo, AppError) y un middleware global de errores en Express. Los servicios comunicarían fallos de negocio conocidos; el middleware los convertiría en respuestas HTTP consistentes (400, 401, 403, 404, 409) y reservaría 500 para errores inesperados.

Beneficios: eliminar try/catch repetidos, unificar el formato de respuesta y facilitar la incorporación de actividades, inscripciones y otros módulos.