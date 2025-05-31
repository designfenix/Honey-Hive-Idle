# Honey Hive Idle

Juego incremental 3D desarrollado con Three.js, GSAP y SCSS modular. Este repositorio contiene todos los archivos necesarios para ejecutar el proyecto en local.

## Estructura de carpetas

```
Honey-Hive-Idle/
├── README.md
├── package.json
├── .gitignore
├── index.html
├── scss/
│   ├── _variables.scss
│   ├── _mixins.scss
│   ├── _base.scss
│   ├── _layout.scss
│   ├── components/
│   │   ├── _header.scss
│   │   ├── _intro-screen.scss
│   │   ├── _loading-screen.scss
│   │   ├── _scene-container.scss
│   │   ├── _upgrade-bar.scss
│   │   ├── _upgrade-card.scss
│   │   └── _sound-toggle.scss
│   └── main.scss
├── css/
│   └── main.css           # Archivo generado por SASS (placeholder)
└── js/
    ├── utils/
    │   ├── formatNumber.js
    │   └── domHelper.js
    ├── services/
    │   └── AssetService.js
    ├── components/
    │   ├── LoadingScreen.js
    │   ├── IntroScreen.js
    │   ├── ResourceBar.js
    │   ├── SoundToggle.js
    │   └── UpgradeCard.js
    ├── three/
    │   └── ThreeScene.js
    ├── GameManager.js
    └── App.js
```

## Requisitos

- Node.js (v14 o superior)
- npm (v6 o superior)

## Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/designfenix/Honey-Hive-Idle.git
   ```
2. Ingresa a la carpeta del proyecto:
   ```bash
   cd Honey-Hive-Idle
   ```
3. Instala las dependencias de desarrollo (live-server y sass):
   ```bash
   npm install
   ```

## Compilar SCSS

Para compilar los archivos SCSS a CSS, ejecuta:
```bash
npm run build-css
```
El archivo resultante `css/main.css` será sobrescrito cada vez que ejecutes este comando.

## Ejecutar en local

Para levantar un servidor local y ver el juego en tu navegador:
```bash
npm start
```
Por defecto `live-server` abrirá `http://127.0.0.1:8080` o `http://localhost:8080`. Cualquier cambio en archivos JS, HTML o CSS recargará la página automáticamente.

## Descripción de los archivos principales

- **index.html**: Archivo HTML principal. Carga todos los scripts JS y el CSS generado.
- **scss/**: Carpeta con estilos SCSS modularizados.
  - `_variables.scss`: Variables globales (colores, fuentes, sprites).
  - `_mixins.scss`: Mixins y funciones para SCSS.
  - `_base.scss`: Reset global y estilos base.
  - `_layout.scss`: Estilos de layout general.
  - **components/**: Estilos por componente (_header, _intro-screen, _loading-screen, etc.).
  - `main.scss`: Archivo principal que importa todos los parciales.
- **css/main.css**: CSS compilado a partir de `scss/main.scss` (puede generarse con `npm run build-css`).
- **js/**: Carpeta con código JavaScript modular:
  - **utils/**: Funciones utilitarias:
    - `formatNumber.js`: Formato de números (K/M).
    - `domHelper.js`: Helper para manipular el DOM de forma segura.
  - **services/**:
    - `AssetService.js`: Clase para cargar assets (GLTF, texturas, audio) con `THREE.LoadingManager`.
  - **components/**:
    - `LoadingScreen.js`: Maneja la barra de carga y su animación.
    - `IntroScreen.js`: Pantalla de introducción con el botón “JUGAR”.
    - `ResourceBar.js`: Actualiza la barra superior de recursos (abejas, néctar, polen, velocidad).
    - `SoundToggle.js`: Botón flotante para activar/desactivar la música.
    - `UpgradeCard.js`: Cada tarjeta de upgrade (abeja, avispa, producción, colmena).
  - **three/**:
    - `ThreeScene.js`: Configura la escena Three.js (renderer, cámara, controles, luces, geometrias, animaciones).
  - `GameManager.js`: Lógica de juego (estado dinámico, compra de upgrades, producción de recursos).
  - `App.js`: Orquestador principal. Carga assets, muestra loading → intro → inicializa ThreeScene, UI y GameManager, inicia bucle de render.
- **package.json**: Contiene scripts para compilar SCSS y levantar servidor local con live-server.
- **.gitignore**: Ignora `node_modules/`.

## Uso

- Al abrir el proyecto en el navegador, verás primero una pantalla de carga.
- Luego aparecerá la pantalla de introducción con el logo y el botón “JUGAR”.
- Al hacer click en “JUGAR”:
  - La intro se desvanece.
  - Aparecen la barra de upgrades y la cabecera con recursos.
  - Se carga la escena 3D con el panal, abejas, avispas y entorno.
  - Inicia la animación de la cámara y producción de recursos.
- Interactúa con las tarjetas para comprar abejas, avispas, mejoras de producción o colmena.

## Desarrollo

- La lógica JS está escrita en ES6 Modules. Puedes usar bundlers como Webpack o simplemente cargar los archivos directamente con `<script type="module">`.
- Para modificar estilos, edita los archivos en `scss/` y luego corre `npm run build-css` para generar `css/main.css`.
- Para ver cambios instantáneos, deja corriendo `npm start` con `live-server`, que refresca al detectar cambios.

---

¡Listo para comenzar a jugar y desarrollar tu propio mundo de abejas!

