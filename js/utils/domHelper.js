// js/utils/domHelper.js

/**
 * Selecciona un elemento del DOM y arroja error si no lo encuentra.
 * @param {string} selector - CSS selector del elemento.
 * @returns {Element} - El elemento encontrado.
 */
export function getElement(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`No se encontró el elemento con selector "\${selector}"`);
  return el;
}

/**
 * Crea un nuevo elemento y lo anexa como hijo de un padre dado.
 * @param {string} tag - Nombre de la etiqueta, ej. "button", "div", etc.
 * @param {Object} options - Objeto con propiedades para asignar (id, className, textContent).
 * @param {Element} parent - Nodo padre donde se anexa el elemento.
 * @returns {Element} - El elemento creado y anexado.
 */
export function createElement(tag, options = {}, parent) {
  const el = document.createElement(tag);
  Object.entries(options).forEach(([key, val]) => {
    if (key === "className") el.className = val;
    else if (key === "textContent") el.textContent = val;
    else el.setAttribute(key, val);
  });
  if (parent) parent.appendChild(el);
  return el;
}
