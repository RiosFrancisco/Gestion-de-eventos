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
Para no repetir conversiones en cada función se creó mapEvento(), asi en ...\repositories\evento.repository.ts, simplemente llamamos a dicha funcion para que se encargue de las conversiones en las funciones que lo requieran. 
Asi tambien se aplicó mapActividad() para ...\repositories\actividad.repository.ts
Y mapUsuario() para ...\repositories\usuario.repository.ts
Beneficios:
- menos código repetido;
- conversiones centralizadas;
- repositories más limpios.
Costo:
- agrega pequeñas funciones auxiliares.

# Test implementados
se priorizó verificar los comportamientos críticos del sistema.
Criterios que se tuvieron en cuenta:
- Importancia de la funcionalidad: Se priorizaron operaciones críticas, como la gestión de eventos, actividades y permisos.
- Riesgo de errores: Se verificaron situaciones que podrían producir operaciones incorrectas o no autorizadas.
- Diversidad de escenarios: Se incluyeron casos exitosos, entradas inválidas y situaciones excepcionales.

Por ejemplo, cancelar un evento requiere verificar más de un escenario: que el creador pueda cancelarlo, que otro usuario no pueda hacerlo y que el sistema rechace eventos inexistentes o ya cancelados.

# Manejo centralizado de errores HTTP
Situación actual: los controladores gestionan errores de forma local y algunas respuestas pueden no distinguir suficientemente entre datos inválidos y falta de permisos (por ejemplo, responder 400 en lugar de 403).

Propuesta: incorporar una clase de error de aplicación (por ejemplo, AppError) y un middleware global de errores en Express. Los servicios comunicarían fallos de negocio conocidos; el middleware los convertiría en respuestas HTTP consistentes (400, 401, 403, 404, 409) y reservaría 500 para errores inesperados.

Beneficios: eliminar try/catch repetidos, unificar el formato de respuesta.

# Módulos pendientes
Noticias: publicación, modificación y eliminación de noticias asociadas a eventos.
Propuestas gastronómicas: gestión de ofertas gastronómicas vinculadas a eventos.
Pagos: administración de pagos y suscripciones para acceder a funcionalidades de creador.
Notificaciones: comunicación de novedades, cancelaciones y modificaciones relevantes.

## Mejoras futuras: 

# Patrones de diseño
A futuro se planea implementar los siguientes patrones de diseño:
- Strategy (comportamiento): Para implementar distintas formas de pago (tarjetas, transferencias, etc) sin llenar el servicio de condicionales.
- Adapter (estructural): Cuando se agregue una pasarela de pagos (api de mercado pago, paypal, etc), esto nos va a permitir aislar la api y los formatos especificos del proveedor detras de una interfaz propia.
- Observer (comportamiento): Cuando se quiera agregar sistema de notificaciones, esto nos ayuda a seguir un protocolo de notificaciones segun el evento ocurrido, por ejemplo, cuando se cancele un evento, tiene que darse aviso a los usuarios registrados para tal evento.




