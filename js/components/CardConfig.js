// cardConfig.js

/**
 * 1) Definimos el orden en que aparecerán las cartas.
 *    Solo se mostrarán en pantalla, de izquierda a derecha,
 *    la carta ya desbloqueada más reciente y, a su derecha,
 *    la siguiente carta bloqueada en la lista.
 */
export const cardOrder = [
  "contratar",         // 1ª carta: “Hire Bee”
  "avispa",            // 2ª carta: “Hire Wasp” (bloqueada hasta “primerCompra”)
  "produccion",        // 3ª carta: “Improve Production” (nivel >= 5)
  "mejorar-colmena",   // 4ª carta: “Improve Hive” (objetivo “recolectar500”)
  "hire-duck",         // 5ª carta: “Hire Duck” (nivel >= 10)
  // … puedes añadir más llaves aquí en el orden que quieras …
];

/**
 * 2) Para cada llave de `cardOrder`, creamos un objeto con los datos
 *    necesarios para "renderizar" la card y para comprobar su desbloqueo.
 */
export const cardConfig = {
  contratar: {
    title: "Hire Bee",
    subtitle: "Generates 1 pollen/s",
    icon: "🐝",
    costIcon: "🔮",
    costKey: "pollen",          // a qué recurso gasta (pollen o nectar)
    baseCost: 20,               // costo base (puede recalcularse dinámicamente)
    unlockCondition: (state) => {
      // Siempre disponible desde el inicio (nivel 1).
      return state.level >= 1;
    },
    lockedText: "",             // Como es la 1ª carta, no la bloqueamos nunca.
  },
  avispa: {
    title: "Hire Wasp",
    subtitle: "Generates 1.5 pollen/s",
    icon: "🦟",
    costIcon: "🔮",
    costKey: "pollen",
    baseCost: 100,
    unlockCondition: (state) => {
      // Se desbloquea al completar la primera compra de abejas (objetivo "primerCompra")
      return state.objectives.has("primerCompra");
    },
    lockedText: "Complete your first Bee purchase",
  },
  produccion: {
    title: "Improve Production",
    subtitle: "+0% / bee",
    icon: "➕",
    costIcon: "🍯",
    costKey: "nectar",
    baseCost: 100,
    unlockCondition: (state) => {
      // Se desbloquea cuando el jugador alcance nivel ≥ 5
      return state.level >= 5;
    },
    lockedText: "Reach Level 5",
  },
  "mejorar-colmena": {
    title: "Improve Hive",
    subtitle: "+0% speed",
    icon: "⚡",
    costIcon: "🍯",
    costKey: "nectar",
    baseCost: 1200,
    unlockCondition: (state) => {
      // Se desbloquea cuando el jugador recolecte 500 nectar (objetivo "recolectar500")
      return state.objectives.has("recolectar500");
    },
    lockedText: "Collect 500 Nectar",
  },
  "hire-duck": {
    title: "Hire Duck",
    subtitle: "Generates 2 pollen/s",
    icon: "🦆",
    costIcon: "🔮",
    costKey: "pollen",
    baseCost: 50,
    unlockCondition: (state) => {
      // Se desbloquea cuando el jugador llegue a nivel ≥ 10
      return state.level >= 10;
    },
    lockedText: "Reach Level 10",
  }
  // … agrega más cartas en el mismo formato si lo necesitas …
};
