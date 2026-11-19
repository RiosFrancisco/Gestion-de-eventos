Ayuda de memoria y justificaciones

1. Actualizado readme: con esto considero que queda bien documentado el paso a paso para reproducir el proyecto en otros dispositivos.
2. Actualizado toma de decisiones
3. Tests destacados para demostracion:
- Test 1. 
Creación correcta de un evento: ...\Backend\src\tests\evento.service.test.ts 
Nombre del test: debe crear un evento cuando los datos son válidos. (175)
Demuestra: caso normal, funcionamiento de una regla de negocio y procesamiento de datos válidos.
Muestra: npm test -- src/tests/evento.service.test.ts

- Test 2. 
Impedir cancelar eventos ajenos: ...\Backend\src\tests\evento.service.test.ts
Nombre del test: no debe permitir cancelar eventos ajenos. (109)
Demuestra: autorización, restricciones de acceso y protección de operaciones.
Muestra: npm test -- src/tests/evento.service.test.ts

- Test 3. 
Rechazar una capacidad negativa: ...\Backend\src\tests\actividad.routes.test.ts
Nombre del test: debe rechazar una capacidad negativa. (133)
Demuestra: validación de límites, rechazo de datos inválidos y respuesta HTTP 400.
Muestra: npm test -- src/tests/actividad.routes.test.ts

- Test 4. 
Rechazar la cancelación de un evento inexistente: ...\Backend\src\tests\evento.service.test.ts
Nombre del test: debe rechazar la cancelación de un evento inexistente. (120)
Demuestra: manejo de errores y protección frente a operaciones sobre recursos inexistentes.
Muestra: npm test -- src/tests/evento.service.test.ts

- Test 5. 
Guardar un evento en PostgreSQL: ...\Backend\src\tests\evento.repository.integration.test.ts
Nombre del test: debe guardar un evento en PostgreSQL. (109)
Demuestra: integración real con la base de datos, inserción y persistencia de información.
Muestra: npm run test:integration -- src/tests/evento.repository.integration.test.ts


Demostracion de mejora: Centralización de conversiones con mapEvento(), mapActividades(), mapUsuario()
En toma-decisiones.md esta explicado pero en resumen, para evitar repetir conversiones, creamos una función auxiliar.
Qué mejora: mantenibilidad, reutilización y consistencia de los datos.