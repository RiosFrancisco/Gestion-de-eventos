# Festival Manager - Plataforma de gestión de eventos

![Festival Manager](./Frontend/assets/img/FestivalLogo.png)

### Integrantes

- Juan Manuel Beltrame
- Ramiro Cutropia
- Francisco Rios
- Matko Scabusso

## Presentación del proyecto

El proyecto consiste en una platadorma web que funciona como un tablón público de eventos locales a fin de informar a la población de los eventos o festividades que estan ocurriendo o están próximos a ocurrir.
Los usuarios podrán participar de los diferentes eventos que la comunidad publique en la página, para lo cual se podrá contratar el servicio de creación y gestión de eventos.

**Para acceder a la aplicación, [>>haga clic en este enlace<<](https://festival-manager-r5le.onrender.com)**

## Usuarios y roles

La plataforma cuenta con dos grandes perfiles:

- **Participantes:** Usuarios registrados que navegan por los eventos y se pueden inscribir en actividades.
- **Administradores de eventos:** Usuarios que cuentan con permisos adicionales para crear y administrar sus propios eventos.

El sistema busca centralizar la información de los eventos y facilitar tanto su administración como la participación de los usuarios.

## Usuario registrado (Participantes)

Todo usuario deberá crear una cuenta para utilizar las funcionalidades principales de la plataforma.

Podrá:

- Registrarse.
- Iniciar sesión.
- Cerrar sesión.
- Consultar eventos próximos.
- Buscar eventos.
- Filtrar eventos.
- Ver información detallada de un evento.
- Consultar actividades.
- Inscribirse a actividades.
- Consultar sus propias inscripciones.
- Gestionar sus datos personales.

## Administrador de eventos

Un usuario podrá obtener permisos de administrador mediante la **contratación de un plan o servicio**.

Una vez realizado y validado el pago, podrá:

- Crear eventos.
- Modificar sus eventos.
- Eliminar sus eventos.
- Administrar actividades.
- Consultar participantes.
- Gestionar inscripciones.
- Modificar la información de sus eventos.

### Control de permisos

Un administrador solamente podrá modificar los eventos que le pertenecen.

Esto será controlado desde el **backend mediante autenticación y autorización**.

Por ejemplo, el usuario A no podrá modificar o alterar de ninguna manera los eventos publicados por el usuario B.

## Página principal

La página principal es el punto de entrada de la plataforma. Este muestra:

- Eventos próximos.
- Eventos recientemente publicados.
- Categorías de eventos.
- Buscador.
- Filtros.
- Información general de la plataforma.

Ejemplo conceptual:

```
╔═════════════════════════════════════════════════╗
║ + 🔎               Festival Manager           ⛭ 🔵 🟥 ║
╚═════════════════════════════════════════════════╝
│                                                        │
│                    Próximos eventos                    │
│                                                        │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│ │ Evento 1      │ │ Evento 2      │ │ Evento 3      │ │
│ │ Fecha         │ │ Fecha         │ │ Fecha         │ │
│ │ Lugar         │ │ Lugar         │ │ Lugar         │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ │
│                                                        │
└─────────────────────────────────────────────────┘

```

## Gestión de eventos

Cada evento tiene su propia información y contenido.

Entre los datos principales se encuentran:

- Nombre.
- Descripción.
- Fecha.
- Hora.
- Ubicación.
- Estado.
- Categoría.

Cada evento tiene diferentes secciones:

```text
EVENTO
│
├── Información
│
├── Actividades
│
└── Inscripciones
```

## Actividades

Cada evento puede tener múltiples actividades.

Ejemplo:

```text
Evento: Feria Tecnológica 2026

Actividades:
├── Charla de Inteligencia Artificial
├── Taller de Programación
├── Competencia de Robótica
└── Workshop de Ciberseguridad
```

Los usuarios podrán:

1. Entrar al evento.
2. Consultar las actividades.
3. Seleccionar una actividad.
4. Consultar su información.
5. Inscribirse.
6. Recibir confirmación de la inscripción.

## Inscripciones

Las inscripciones se asocian a un **usuario registrado** y a una actividad.

```text
Usuario
   │
   │ se inscribe
   ▼
Actividad
   │
   ▼
Evento
```

Esto permite que el usuario pueda consultar posteriormente sus actividades inscritas desde la página de su perfil.

A su vez, el administrador podrá consultar los participantes de las actividades pertenecientes a sus eventos.

## Sistema de contratación (WIP)

Para que los usuarios puedan crear, editar y administrar eventos propios, deberán suscribirse a un plan de pago para tener acceso a dichas herramientas. Esto no solo sirve como medio de facturación para poder mantener el proyecto en el futuro, sino para restringir el mal uso de la herramienta de creación de eventos.

Flujo conceptual:

```text
Usuario
   │
   ▼
Selecciona un plan
   │
   ▼
Realiza el pago
   │
   ▼
Pago validado
   │
   ▼
Obtiene permisos de administrador
   │
   ▼
Puede crear y gestionar su evento
```

El sistema deberá validar que el pago haya sido correctamente procesado antes de habilitar los permisos correspondientes.

## Autenticación y autorización

### Autenticación

La autenticación será realizada mediante **JSON Web Token (JWT)**.

El objetivo es permitir que el backend identifique al usuario que realiza cada solicitud.

Flujo básico:

```text
Usuario
   │
   │ Login
   ▼
Backend
   │
   │ Verifica credenciales
   ▼
  JWT
   │
   ▼
Usuario autenticado
```

Las solicitudes que requieran autenticación deberán incluir el token correspondiente.

### Autorización

Además de identificar qué usuario está conectado, el backend deberá determinar **qué acciones tiene permitidas**.

Ejemplo:

```text
Usuario normal
├── Ver eventos       ✅
├── Inscribirse       ✅
└── Crear evento      ❌

Creador
├── Ver eventos       ✅
├── Inscribirse       ✅
└── Crear evento      ✅

Administrador
├── Ver eventos       ✅
├── Inscribirse       ✅
├── Crear evento      ✅
├── Modificar informacion de usuarios ✅
├── Gestionar Roles   ✅
├── Eliminar eventos  ✅
└── Eliminar usuarios ✅
```

---

## Validaciones

La aplicación cuenta con validaciones tanto en **frontend** para feedback al usuario, como en **backend** para mantener la consistencia de datos.

### Registro

- Nombre obligatorio.
- Email obligatorio con formato válido.
- Contraseña obligatoria y con requisitos.
- Confirmación de contraseña.

### Eventos

- Nombre obligatorio.
- Descripción obligatoria.
- Fecha válida.
- Ubicación obligatoria.
- Datos consistentes.

### Actividades

- Nombre obligatorio.
- Descripción obligatoria.
- Fecha válida.
- Capacidad válida (si corresponde).

### Inscripciones

- Usuario autenticado.
- Actividad existente.
- Actividad disponible.
- Evitar inscripciones duplicadas.

## Base de datos

La base de datos está diseñada siguiendo buenas prácticas de modelado y buscando garantizar la consistencia e integridad de la información.

Entre las entidades principales se encuentran:

```text
USUARIO
   │
   ├───────────────┐
   │                 │
   ▼                 ▼
EVENTO          INSCRIPCIÓN
                     │
                     ▼
                 ACTIVIDAD
```

Se comtemplan:

- Claves primarias.
- Claves foráneas.
- Integridad referencial.
- Restricciones.
- Campos obligatorios.
- Unicidad.
- Relaciones entre entidades.
- Consistencia de los datos.

## Arquitectura del Backend

El backend se desarrolló con:

- **SQL**
- **TypeScript**
- **Node.js**

La estructura de archivos del backend mantiene una arquitectura organizada por responsabilidades para mejor mantenimiento y legibilidad:

```text
Backend/
├── database/
│    ├── schema.sql
│    └── seed.sql
└── src/
     ├── config/
     ├── controllers/
     ├── errors/
     ├── middleware/
     ├── models/
     ├── repositories/
     ├── routes/
     ├── schemas/
     ├── services/
     ├── tests/
     ├── utils/
     ├── app.ts
     └── server.ts
```

La lógica de negocio se concentra únicamente en las rutas o controladores.

Flujo conceptual:

```
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

## Frontend

Para el frontend, se utiliza:

- HTML5
- CSS3
- JavaScript
- Recursos
  - PNG
  - TTF

La interfaz permite:

- Registro.
- Inicio de sesión.
- Navegación de eventos.
- Búsqueda y filtrado.
- Visualización de eventos y actividades.
- Inscripciones.
- Perfil del usuario.
- Panel administrativo.
- Gestión de eventos.

Su estructura de archivos tiene un diseño modular, el cual facilita su mantenimiento y legibilidad para hacer cambios o correcciones.

```text
Frontend/
├── assets/
│    ├── favicon/
│    │    └── favIcon.png
│    ├── fonts/
│    │    ├── MomoTrustDisplay-Regular.ttf
│    │    └── MomoTrustSans-VariableFont_wght.ttf
│    └── img/
│         ├── addEventButton.png
│         ├── FestivalLogo.png
│         ├── FestivalLogoWhite.png
│         ├── logOutIcon.png
│         ├── myEvents.png
│         ├── registerIcon.png
│         ├── searchIcon.png
│         └── userIcon.png
├── css/
│    ├── components/
│    │    ├── button.css
│    │    ├── event-container.css
│    │    ├── event-list.css
│    │    ├── footer.css
│    │    ├── forms.css
│    │    ├── header.css
│    │    ├── main.css
│    │    ├── mensaje-formulario.css
│    │    └── nav.css
│    ├── agregar_evento.css
│    ├── mis_eventos.css
│    ├── perfil.css
│    ├── style.css
│    └── variables.css
├── js/
│    ├── agregar_evento.js
│    ├── detalle-evento.js
│    ├── index.js
│    ├── nav.js
│    └── perfil.js
├── pages/
│    ├── agregar_evento.html
│    ├── detalle_evento.html
│    ├── index.html
│    ├── mis_eventos.html
│    └── perfil.html
├── notas-taller.md
├── README.md
└── toma-decisiones.md
```

## Otras tecnologías

### Base de Datos

- PostgreSQL

### Dependencias

- Next.js
- Express
- Cors
- dotenv
- JSON Web Token (JWT)
- BCrypt
- Zod
- pg
- tsx
- Eslint

Además, se utilizarán las correspondientes dependencias de tipos para TypeScript:

- @types/node
- @types/react
- @types/react-dom
- @types/express
- @types/cors
- @types/jsonwebtoken
- @types/bcrypt

## Funcionamiento

El proyecto funciona por tres servicios de [Render](https://render.com/).
Uno para el **frontend**, uno para el **backend**, y uno para la **base de datos**.

El Frontend se comunica con el Backend, y este a su vez se comunica con la base de datos de Postgres para las peticiones HTTP.

En forma de diagrama, el flujo se representa de esta forma:

```
Navegador/Frontend ➔➔➔ Backend ➔➔➔ Base de datos (PostgreSQL)
```

### Deploy de frontend

El frontend se encuentra alojado como un _Static Web_, el cual lee el último commit de la rama `main` en la ruta `./Frontend`, donde se alojan todos los archivos de la interfaz.

### Deploy de backend

El backend se encuentra alojado como un _Web Service_, que al igual que el deploy del Frontend, lee el último commit de la rama `main`, pero este apunta hacia la ruta `./Backend`, donde se alojan todos los archivos del backend.

### Base de datos con Postgres

La aplicación utiliza una instancia gestionada de PostgreSQL alojada en Render para persistir la información del sistema (como eventos, usuarios, roles o categorías).

El backend se conecta a esta base mediante variables de entorno (`DATABASE_URL`), y la estructura inicial junto con los datos base se cargan a partir de los scripts SQL del repositorio (`schema.sql` y `seed.sql`).

### Instalación y ejecución
## Requisitos previos
Antes de comenzar, necesitás instalar estas herramientas:
- Node.js	-- Para ejecutar el backend
- PostgreSQL	-- Para almacenar los datos
- pgAdmin 4	-- Administrar las bases de datos
- Visual Studio Code   -- Abrir y trabajar con el código
- Postman	-- Probar los endpoints de la API

# 1. Clonar el repositorio
git clone https://github.com/RiosFrancisco/Gestion-de-eventos

# 2. Instalar las dependencias
- Frontend
cd frontend
npm ci

- Backend
cd ../backend
npm ci

# 3. Crear las bases de datos PostgreSQL
Necesitás dos bases de datos diferentes:
- gestion_eventos: para ejecutar normalmente la aplicación.
- gestion_de_eventos_test: exclusivamente para realizar pruebas de integración.

Abrí pgAdmin 4, conectate a tu servidor PostgreSQL y seguí estos pasos:
1. Buscá Databases.
2. Hacé clic derecho y seleccioná Create → Database.
3. En el campo Database, escribí gestion_eventos.
4. Guardá.
Repetí los pasos para gestion_de_eventos_test.
Si PostgreSQL solicita una contraseña, utilizá la correspondiente al usuario de tu instalación.

En pgAdmin:
1. Seleccioná la base de datos gestion_eventos.
2. Abrí Query Tool.
3. Abrí el contenido de schema.sql, pegalo en Query Tool y ejecutalo con el botón de reproducción.
4. Repetí el mismo paso con el contenido de seed.sql.
Repetí exactamente el mismo procedimiento para gestion_de_eventos_test.

# 4. Configurar las variables de entorno
- En la carpeta principal Backend, creá un archivo llamado .env.

Agregá:
   PORT=3001
   DATABASE_URL=postgresql://postgres:TU_PASSWORD@localhost:5432/gestion_eventos
   JWT_SECRET=CAMBIAR_POR_UN_SECRETO_LARGO_Y_ALEATORIO

Tenés que reemplazar TU_PASSWORD por la contraseña real de PostgreSQL y JWT_SECRET por una clave secreta propia, larga y aleatoria.

- Creá otro archivo en la misma carpeta, llamado .env.test.

Agregá: 
   DATABASE_URL_TEST=postgresql://postgres:TU_PASSWORD@localhost:5432/gestion_de_eventos_test
   JWT_SECRET=OTRO_SECRETO_LARGO_Y_ALEATORIO_PARA_TESTING

# 5. Ejecutar el Backend
Desde la carpeta backend:
npm run dev

# 6. Ejecutar el Frontend
En otra terminal, desde la carpeta frontend:
cd frontend
npm run dev

Si los pasos se siguieron correctamente, deberias poder levantar ambos servidores sin errores.

## Base de datos de testing

El proyecto utiliza Vitest para ejecutar pruebas automatizadas y Supertest para verificar el comportamiento de los endpoints HTTP.

Para poder ejecutar los tests, desde una terminal ubicada en la carpeta backend, ejecutar:

- Pruebas unitarias y de rutas:
  npm test

- Pruebas de integración con PostgreSQL:
  npm run test:integration

- Verificación de tipos de TypeScript:
  npm run typecheck

- Para comprobar únicamente la conexión a PostgreSQL y la existencia de la tabla de eventos:
  npm run test:integration -- src/tests/database.integration.test.ts

# Funcionalidades previstas

## Usuarios

- [x] Registro.
- [x] Inicio de sesión.
- [x] Cierre de sesión.
- [x] Autenticación mediante JWT.
- [x] Perfil de usuario.
- [x] Consulta de inscripciones.

## Eventos

- [x] Listado de eventos.
- [x] Eventos próximos.
- [x] Búsqueda.
- [x] Filtros.
- [x] Detalle del evento.
- [x] Creación de eventos.
- [x] Edición de eventos.
- [x] Cancelación de eventos.

## Actividades

- [x] Crear actividades.
- [x] Editar actividades.
- [x] Cancelar actividades.
- [x] Consultar actividades.
- [x] Inscripción a actividades.
- [x] Control de cupos.
- [x] Prevención de inscripciones duplicadas.

## Administración

- [ ] Panel administrativo.
- [x] Gestión de eventos propios.
- [x] Gestión de actividades.
- [ ] Consulta de participantes.

## Pagos (A FUTURO)

- [ ] Visualización de planes.
- [ ] Contratación.
- [ ] Procesamiento del pago.
- [ ] Validación del pago.
- [ ] Habilitación de permisos de administrador.