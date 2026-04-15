# Genesis 2.0

Este proyecto emplea el template **Fuse** y utiliza las tecnologías de **Angular 17** y **Electron**.

## 🚀 Guía de Ejecución

Sigue estos pasos para configurar y ejecutar el proyecto localmente desde tu editor de código (VS Code recomendado).

## 1. Requisitos Previos

Asegúrate de tener instalado:
* **Node.js**: Versión compatible (recomendada versión >= v20). Utilizada en desarrollo la versión v22.20.0
* **Angular CLI**: `npm install -g @angular/cli`
* **Gestor de paquetes**: npm (incluido con Node.js)

## 2. Instalación de Dependencias

Abre una terminal en la raíz del proyecto y ejecuta:
```bash
npm install
```

## 3. Ejecución en Desarrollo

Puedes arrancar la aplicación de dos formas según tu objetivo:
* **Modo Web (Navegador)**
```bash
npm start
```
O directamente con `ng serve`. La app estará en http://localhost:4200.

* **Modo Desktop (Ventana Electron)**

Para probar la experiencia de escritorio sin generar un instalador:
```bash
npm run electron
```

### 📦 Generación de Ejecutable (Build)

Para empaquetar la aplicación y generar los archivos distribuibles, los resultados se alojarán en la carpeta `dist/` en la raíz del proyecto.

#### Construir para Escritorio (Windows/Desktop)
Para generar el instalador ejecutable (`.exe`), ejecuta:

```bash
npm run electron:build-desktop
```

Este comando realiza las siguientes acciones:

1. Compila el código Angular con `--base-href ./` (necesario para que Electron localice los recursos).

2. Utiliza `electron-builder` para empaquetar la aplicación.

3. **Ubicación del ejecutable**: Una vez finalizado, encontrarás el instalador en la carpeta `dist/` (generalmente dentro de una subcarpeta como `dist/win-unpacked` o directamente como un archivo `.exe`).

#### Construir para Web
Si solo necesitas la versión web:
```bash
npm run build
```

## 📂 Estructura de Directorios

La aplicación sigue una arquitectura modular y escalable dentro de la carpeta `src/app`. A continuación se detalla el propósito de cada directorio:

### 🏗️ Arquitectura Base
* `@fuse`: Es el núcleo del template. Contiene los componentes base, servicios de configuración visual (temas, colores), animaciones y utilidades de diseño propias de la plataforma Fuse. No se recomienda modificar esta carpeta a menos que sea estrictamente necesario para personalizar el framework.

* `core`: Contiene los servicios esenciales utilizados en el sistema.

* `layout`: Define la estructura visual de la aplicación. Incluye los diferentes diseños de página (navegación superior, etc) que envuelven el contenido principal.

### 🧩 Lógica de Negocio y UI

* `pages`: Es la carpeta principal de desarrollo. Aquí se encuentran las vistas o pantallas completas de la aplicación, organizadas por módulos funcionales o secciones de negocio.

* `components`: Alberga componentes de interfaz de usuario reutilizables en múltiples partes de la aplicación (ej. botones personalizados, modales, etc.).

* `services`: Servicios encargados de la lógica de negocio que será consumida por los componentes.

* `models`: Define los contratos de datos mediante **interfaces y clases de TypeScript**. Asegura que el flujo de información sea coherente y esté tipado en toda la app.

### 🛠️ Herramientas y Utilidades

* `directives`: Directivas personalizadas para manipular el comportamiento o la apariencia de los elementos del DOM de forma declarativa.

* `pipes`: Transformadores de datos para las plantillas HTML (ej. formateo de moneda, manejo de fechas personalizado o filtros de búsqueda).

* `utils`: Funciones auxiliares, constantes y herramientas lógicas puras que no dependen directamente del framework Angular, facilitando su testeo y reutilización.


### 📄 Archivos de Configuración (Raíz de `src/app`)

| Archivo | Propósito |
|---------|-----------|
| `app.routes.ts` | Archivo central donde se definen todas las rutas y la navegación de la aplicación.|
| `app.config.ts` | Configuración de los proveedores globales de Angular (v17+), incluyendo animaciones y configuraciones de módulos externos. |
| `app.component.ts` | El punto de entrada visual de la aplicación. |
| `main.js` | Configuración del proceso principal de Electron para la ventana de escritorio. |