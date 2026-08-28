# Plataforma de Gestión de Eventos

## Integrantes:


## Presentación del proyecto
# Objetivo del proyecto

El objetivo es desarrollar una plataforma web **multi-evento** que permita a los usuarios participar en diferentes eventos y, mediante la contratación del servicio correspondiente, obtener permisos para crear y administrar sus propios eventos.

La plataforma contará con dos grandes perfiles:

- **Participantes:** usuarios registrados que navegan por los eventos y se inscriben en actividades.
- **Administradores de eventos:** usuarios que cuentan con permisos adicionales para crear y administrar sus propios eventos.

El sistema busca centralizar la información de los eventos y facilitar tanto su administración como la participación de los usuarios.

# Usuarios y roles

## Usuario registrado

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
- Consultar noticias.
- Consultar propuestas gastronómicas.
- Inscribirse a actividades.
- Consultar sus propias inscripciones.
- Gestionar sus datos personales.

---

## Administrador de evento

Un usuario podrá obtener permisos de administrador mediante la **contratación de un plan o servicio**.

Una vez realizado y validado el pago, podrá:

- Crear eventos.
- Modificar sus eventos.
- Eliminar sus eventos.
- Administrar actividades.
- Administrar noticias.
- Administrar propuestas gastronómicas.
- Consultar participantes.
- Gestionar inscripciones.
- Modificar la información de sus eventos.

### Control de permisos

Un administrador solamente podrá modificar los eventos que le pertenecen.

Juan no debería poder modificar el Evento B de Pedro.

Esto será controlado desde el **backend mediante autenticación y autorización**.

# Página principal

La página principal será el punto de entrada de la plataforma.

Podrá mostrar:

- Eventos próximos.
- Eventos destacados.
- Eventos recientemente publicados.
- Categorías de eventos.
- Buscador.
- Filtros.
- Información general de la plataforma.

Ejemplo conceptual:

```
┌─────────────────────────────────────────────┐
│ LOGO       Eventos   Buscar     Mi cuenta   │
├─────────────────────────────────────────────┤
│                                             │
│              PRÓXIMOS EVENTOS               │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Evento 1 │  │ Evento 2 │  │ Evento 3 │  │
│  │ Fecha    │  │ Fecha    │  │ Fecha    │  │
│  │ Lugar    │  │ Lugar    │  │ Lugar    │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```
# Gestión de eventos

Cada evento tendrá su propia información y contenido.

Entre los datos principales podrán encontrarse:

- Nombre.
- Descripción.
- Fecha.
- Hora.
- Ubicación.
- Imagen.
- Categoría.
- Estado.
- Administrador responsable.

Cada evento podrá contener diferentes secciones:

```text
EVENTO
│
├── Información
│
├── Actividades
│
├── Gastronomía
│
├── Noticias
│
└── Inscripciones
```

# Actividades

Cada evento podrá tener múltiples actividades.

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

# Inscripciones

Las inscripciones estarán asociadas a un **usuario registrado** y a una actividad.

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

Esto permitirá que el usuario pueda consultar posteriormente sus actividades inscritas.

A su vez, el administrador podrá consultar los participantes de las actividades pertenecientes a sus eventos.


# Noticias

Cada administrador podrá publicar noticias relacionadas con sus eventos.

Una noticia podrá contener:

- Título.
- Descripción.
- Imagen.
- Fecha de publicación.
- Evento asociado.

Los usuarios podrán consultar las noticias publicadas desde la página correspondiente del evento.

---

# Gastronomía

Los eventos podrán contar con una sección gastronómica.

El administrador podrá agregar información como:

- Nombre del establecimiento o propuesta.
- Descripción.
- Ubicación dentro del evento.
- Horarios.
- Información adicional.

---

# Sistema de contratación

Una funcionalidad central será permitir que un usuario pueda **contratar un plan para administrar un evento**.

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

---

# Autenticación y autorización

La autenticación se realizará mediante **JSON Web Token (JWT)**.

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

## Autorización

Además de identificar al usuario, el backend deberá determinar **qué acciones tiene permitidas**.

Ejemplo:

```text
Usuario normal
├── Ver eventos       ✅
├── Inscribirse       ✅
└── Crear evento      ❌

Administrador
├── Ver eventos       ✅
├── Inscribirse       ✅
└── Crear evento      ✅
```

---

# Validaciones

La aplicación contará con validaciones tanto en **frontend como en backend**.

Las validaciones importantes deberán realizarse en el backend, ya que no se debe confiar exclusivamente en los datos enviados desde el cliente.

## Registro

- Nombre obligatorio.
- Email obligatorio.
- Email con formato válido.
- Contraseña obligatoria.
- Contraseña con requisitos mínimos.
- Confirmación de contraseña.

## Eventos

- Nombre obligatorio.
- Descripción obligatoria.
- Fecha válida.
- Ubicación obligatoria.
- Datos consistentes.

## Actividades

- Nombre obligatorio.
- Descripción obligatoria.
- Fecha válida.
- Capacidad válida, si corresponde.

## Inscripciones

- Usuario autenticado.
- Actividad existente.
- Actividad disponible.
- Evitar inscripciones duplicadas.

---

# Base de datos

La base de datos será diseñada siguiendo buenas prácticas de modelado y buscando garantizar la consistencia e integridad de la información.

Entre las entidades principales podrían encontrarse:

```text
USUARIO
   │
   ├───────────────┐
   │               │
   ▼               ▼
EVENTO          INSCRIPCIÓN
   │               │
   ├──────┐        ▼
   │      │     ACTIVIDAD
   ▼      ▼
NOTICIA  GASTRONOMÍA
```

Se deberán contemplar:

- Claves primarias.
- Claves foráneas.
- Integridad referencial.
- Restricciones.
- Campos obligatorios.
- Unicidad.
- Relaciones entre entidades.
- Consistencia de los datos.


# Arquitectura del Backend

El backend se desarrollará utilizando:

- **JavaScript**
- **Node.js**

Se buscará mantener una arquitectura organizada por responsabilidades.

Ejemplo:

```text
src/
│
├── controllers/
├── services/
├── repositories/
├── routes/
├── middlewares/
├── validators/
├── models/
├── config/
└── utils/
```

La lógica de negocio no deberá concentrarse únicamente en las rutas o controladores.

Flujo conceptual:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

# Frontend

Para el frontend se podrá utilizar:

- **React**
- o **Next.js**

La interfaz deberá permitir:

- Registro.
- Login.
- Navegación de eventos.
- Búsqueda.
- Filtros.
- Visualización de eventos.
- Visualización de actividades.
- Inscripciones.
- Perfil del usuario.
- Panel administrativo.
- Gestión de eventos.

---

# Tecnologías

## Frontend

- React / Next.js
- JavaScript / TypeScript
- HTML
- CSS

## Backend

- Node.js
- JavaScript / TypeScript
- API REST

## Seguridad

- JSON Web Token (JWT)
- Hashing de contraseñas
- Middleware de autenticación y autorización
- Validación de datos

## Base de datos

- Base de datos relacional
- Transacciones
- Integridad referencial
- Propiedades ACID

## Buenas prácticas

- Principios SOLID
- Separación de responsabilidades
- Validaciones
- Manejo de errores
- Variables de entorno
- Código modular
- Control de acceso por roles

---

# Funcionalidades previstas

## Usuarios

- [ ] Registro.
- [ ] Inicio de sesión.
- [ ] Cierre de sesión.
- [ ] Autenticación mediante JWT.
- [ ] Perfil de usuario.
- [ ] Consulta de inscripciones.

## Eventos

- [ ] Listado de eventos.
- [ ] Eventos próximos.
- [ ] Búsqueda.
- [ ] Filtros.
- [ ] Detalle del evento.
- [ ] Creación de eventos.
- [ ] Edición de eventos.
- [ ] Eliminación de eventos.

## Actividades

- [ ] Crear actividades.
- [ ] Editar actividades.
- [ ] Eliminar actividades.
- [ ] Consultar actividades.
- [ ] Inscripción a actividades.
- [ ] Control de cupos.
- [ ] Prevención de inscripciones duplicadas.

## Noticias

- [ ] Crear noticias.
- [ ] Editar noticias.
- [ ] Eliminar noticias.
- [ ] Consultar noticias.

## Gastronomía

- [ ] Crear propuestas gastronómicas.
- [ ] Editar propuestas.
- [ ] Eliminar propuestas.
- [ ] Consultar propuestas.

## Administración

- [ ] Panel administrativo.
- [ ] Gestión de eventos propios.
- [ ] Gestión de actividades.
- [ ] Gestión de noticias.
- [ ] Gestión gastronómica.
- [ ] Consulta de participantes.

## Pagos

- [ ] Visualización de planes.
- [ ] Contratación.
- [ ] Procesamiento del pago.
- [ ] Validación del pago.
- [ ] Habilitación de permisos de administrador.
