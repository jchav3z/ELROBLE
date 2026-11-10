"use strict";

(() => {
  const CATALOG = Object.freeze({
    drill: { name: "Taladro percutor 650 W", unit: "unidades", available: 4, price: 39990, category: "Herramienta eléctrica", description: "Mandril de 13 mm · velocidad variable", art: "drill-art" },
    screws: { name: "Tornillo para madera #8 (caja de 100)", unit: "cajas", available: 12, price: 3490, category: "Fijaciones", description: "Acero zincado · caja de 100", art: "screw-art" },
    paint: { name: "Pintura látex interior blanca (galón)", unit: "galones", available: 1, price: 18990, category: "Pinturas", description: "Blanco mate · uso interior", art: "paint-art", alternative: "paint-pro" },
    "paint-pro": { name: "Pintura látex interior blanca, línea profesional (galón)", unit: "galones", available: 3, price: 22990, category: "Pinturas", description: "Mayor rendimiento · uso interior", art: "paint-art" },
    gloves: { name: "Guantes de trabajo, talla M", unit: "pares", available: 8, price: 4990, category: "Protección", description: "Palma reforzada · talla M", art: "gloves-art" },
    cement: { name: "Cemento preparado 25 kg", unit: "sacos", available: 0, price: 4790, category: "Albañilería", description: "Mezcla lista para reparación", art: "cement-art" },
    plank: { name: "Tablón de pino 1,2 m", unit: "unidades", available: 20, price: 6490, category: "Madera", description: "Madera cepillada · uso interior", art: "wood-art" },
    bracket: { name: "Soporte metálico para repisa", unit: "unidades", available: 30, price: 2990, category: "Soportes", description: "Soporte individual · negro mate", art: "bracket-art" },
    level: { name: "Nivel torpedo 23 cm", unit: "unidades", available: 8, price: 7490, category: "Medición", description: "Aluminio · 3 burbujas", art: "level-art" },
    roller: { name: "Rodillo antigota 23 cm", unit: "unidades", available: 5, price: 5290, category: "Pinturas", description: "Para muros · mango ergonómico", art: "roller-art" },
    tape: { name: "Cinta de enmascarar 24 mm", unit: "rollos", available: 12, price: 1990, category: "Preparación", description: "Protección para pintar · 40 m", art: "tape-art" },
    sandpaper: { name: "Lija para muro grano 120", unit: "hojas", available: 30, price: 790, category: "Preparación", description: "Acabado medio · hoja", art: "sandpaper-art" },
    patch: { name: "Pasta de reparación interior", unit: "envases", available: 6, price: 5990, category: "Reparación", description: "Para grietas y pequeños hoyos", art: "patch-art" },
    trowel: { name: "Llana lisa 28 cm", unit: "unidades", available: 5, price: 6990, category: "Herramientas manuales", description: "Hoja de acero · mango cómodo", art: "trowel-art" },
    brush: { name: "Brocha multipropósito 2 pulgadas", unit: "unidades", available: 8, price: 2490, category: "Pinturas", description: "Cerda mixta · uso general", art: "brush-art" },
    tray: { name: "Bandeja para rodillo", unit: "unidades", available: 4, price: 2790, category: "Pinturas", description: "Plástico resistente · hasta 23 cm", art: "tray-art" },
  });
  const STORAGE_KEY = "el-roble-demo-quotes";
  let memoryQuotes = [];

  function getCatalog() {
    return Object.entries(CATALOG)
      .filter(([sku]) => sku !== "paint-pro")
      .map(([sku, product]) => ({ sku, ...product }));
  }

  function getProduct(sku) {
    const product = CATALOG[sku];
    return product ? { sku, ...product } : null;
  }

  function readInventory(items) {
    return items.map(({ sku, quantity }) => {
      const product = CATALOG[sku];
      if (!product) {
        return { sku, name: "Producto sin coincidencia", unit: "unidades", quantity, available: 0, found: false, alternative: null };
      }
      const alternative = product.alternative ? CATALOG[product.alternative] : null;
      return {
        sku,
        name: product.name,
        unit: product.unit,
        quantity,
        available: product.available,
        found: true,
        alternative: alternative
          ? { sku: product.alternative, name: alternative.name, unit: alternative.unit, available: alternative.available }
          : null,
      };
    });
  }

  function getQuotes() {
    try {
      return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return memoryQuotes;
    }
  }

  function getHistory() {
    return getQuotes()
      .filter((quote) => quote.status === "Completada")
      .sort((a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt));
  }

  function saveQuote({ items, project, approvedByHuman = false }) {
    const quote = {
      id: `ER-${String(getQuotes().length + 1).padStart(3, "0")}`,
      project,
      items,
      approvedByHuman,
      createdAt: new Date().toISOString(),
      status: "cotización preliminar",
    };
    const quotes = [...getQuotes(), quote];
    memoryQuotes = quotes;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
    } catch {
      // La cotización permanece en memoria si el navegador limita el almacenamiento.
    }
    return quote;
  }

  function updateQuoteStatus(id, status) {
    const quotes = getQuotes();
    const quote = quotes.find((item) => item.id === id);
    if (!quote) return false;
    quote.status = status;
    quote.updatedAt = new Date().toISOString();
    if (status === "Completada") quote.completedAt = quote.updatedAt;
    memoryQuotes = quotes;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
    } catch {
      // El estado de la cotización permanece en memoria durante esta sesión.
    }
    return true;
  }

  window.ElRobleTools = Object.freeze({ getCatalog, getProduct, readInventory, saveQuote, updateQuoteStatus, getHistory });
})();
