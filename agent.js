"use strict";

(() => {
  const UNSAFE_INSTRUCTIONS = [
    /\bignora\b/,
    /\bolvida\b/,
    /\binstrucciones (?:anteriores|previas)\b/,
    /\bsystem prompt\b/,
    /\bomite\b/,
    /\bsin (?:aprobacion|revision|validacion)\b/,
    /\b(?:compra|registra|aprueba|despacha)\b.{0,70}\b(?:automaticamente|sin (?:pagar|revisar|aprobar))\b/,
    /\btodo el (?:catalogo|inventario)\b/,
    /\b(?:catalogo|inventario) (?:completo )?gratis\b/,
    /\bdame (?:todo|el catalogo|el inventario)\b/,
    /\bgratis\b/,
    /\bsin pagar\b/,
    /\bborra las restricciones\b/,
  ];
  const UNSUPPORTED_PRODUCTS = /\b(sierras?|serruchos?|martillos?|clavos?|destornilladores?|llaves inglesas?|candados?|cerraduras?)\b/;

  const PRODUCT_REQUESTS = [
    { sku: "drill", names: /\btaladros?\b/, request: /\b(\d+|un|uno|una)\s*(?:(?:unidades?)\s+(?:de\s+)?)?taladros?(?:\s+percutores?)?\b/ },
    { sku: "screws", names: /\btornillos?\b/, request: /\b(\d+|un|una|uno)\s*(?:(?:cajas?)\s+(?:de\s+)?)?tornillos?(?:\s+(?:para\s+)?madera)?\b/ },
    { sku: "paint", names: /\bpintura\b/, request: /\b(\d+|un|una|uno)\s*(?:(?:galones?)\s+(?:de\s+)?)?pintura(?:\s+latex)?(?:\s+interior)?(?:\s+blanc[oa])?\b/ },
    { sku: "gloves", names: /\bguantes?\b/, request: /\b(\d+|un|una|uno)\s*(?:(?:pares?)\s+(?:de\s+)?)?guantes?(?:\s+de\s+trabajo)?(?:\s+talla\s+[a-z])?\b/ },
    { sku: "cement", names: /\bcemento\b/, request: /\b(\d+|un|una|uno)\s*(?:(?:sacos?)\s+(?:de\s+)?)?cemento(?:\s+preparado)?\b/ },
    { sku: "plank", names: /\b(?:tablon|madera|pino)\b/, request: /\b(\d+|un|una|uno)\s*(?:(?:unidades?)\s+(?:de\s+)?)?(?:tablones?|tablon(?:es)? de pino|madera)\b/ },
    { sku: "bracket", names: /\bsoportes?\b/, request: /\b(\d+|un|una|uno)\s*(?:(?:soportes?)\s+(?:para\s+)?)?(?:soportes? (?:metalicos? )?para repisa|soportes?)\b/ },
    { sku: "level", names: /\bniveles?\b/, request: /\b(\d+|un|una|uno)\s*(?:(?:unidades?)\s+(?:de\s+)?)?niveles?\b/ },
    { sku: "roller", names: /\brodillos?\b/, request: /\b(\d+|un|una|uno)\s*(?:(?:unidades?)\s+(?:de\s+)?)?rodillos?\b/ },
    { sku: "tape", names: /\bcintas?\b/, request: /\b(\d+|un|una|uno)\s*(?:(?:rollos?)\s+(?:de\s+)?)?cintas?(?:\s+de enmascarar)?\b/ },
    { sku: "sandpaper", names: /\blijas?\b/, request: /\b(\d+|un|una|uno)\s*(?:(?:hojas?)\s+(?:de\s+)?)?lijas?\b/ },
    { sku: "patch", names: /\b(?:pasta|resane|resanar|grietas?)\b/, request: /\b(\d+|un|una|uno)\s*(?:(?:envases?)\s+(?:de\s+)?)?(?:pasta de reparacion|resane|resanar)\b/ },
    { sku: "trowel", names: /\b(?:llanas?|fraguas?)\b/, request: /\b(\d+|un|una|uno)\s*(?:(?:unidades?)\s+(?:de\s+)?)?(?:llanas?|fraguas?)\b/ },
    { sku: "brush", names: /\bbrochas?\b/, request: /\b(\d+|un|una|uno)\s*(?:(?:unidades?)\s+(?:de\s+)?)?brochas?\b/ },
    { sku: "tray", names: /\bbandejas?\b/, request: /\b(\d+|un|una|uno)\s*(?:(?:unidades?)\s+(?:de\s+)?)?bandejas?\b/ },
  ];

  function normalize(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function parseQuantity(token) {
    if (/^un[oa]?$/i.test(token)) return 1;
    return Number.parseInt(token, 10);
  }

  function hasUnsafeInstruction(text) {
    return UNSAFE_INSTRUCTIONS.some((pattern) => pattern.test(text));
  }

  function makeProjectPlan(description) {
    const normalized = normalize(description.trim());
    if (!normalized) {
      return { route: "clarify", reason: "Describe qué vas a construir o reparar para que pueda sugerir materiales." };
    }
    if (hasUnsafeInstruction(normalized)) {
      return { route: "blocked", reason: "La solicitud incluye instrucciones para saltar controles o pedir artículos gratis. No las ejecutaré ni consultaré herramientas." };
    }
    const unsupported = normalized.match(UNSUPPORTED_PRODUCTS);
    if (unsupported) {
      return { route: "clarify", reason: `No puedo incluir “${unsupported[0]}” desde este catálogo. No dejaré fuera un producto sin avisarte.` };
    }

    if (/\b(repisas?|estanterias?|estantes?|libreros?)\b/.test(normalized)) {
      const lengthMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:m|metros?)\b/);
      const length = lengthMatch ? Number(lengthMatch[1].replace(",", ".")) : 1.2;
      const boards = Math.max(1, Math.min(8, Math.ceil(length / 1.2)));
      return {
        route: "suggestions",
        project: "Instalar una repisa",
        note: `Lista inicial para una repisa de ${length.toLocaleString("es-CL")} m. Ajusta la cantidad de soportes según el muro y el peso esperado.`,
        items: [
          { sku: "plank", quantity: boards },
          { sku: "bracket", quantity: boards * 2 },
          { sku: "screws", quantity: 1 },
          { sku: "level", quantity: 1 },
        ],
      };
    }

    if (/\b(pintar|pintura)\b/.test(normalized) && /\b(habitacion|pieza|dormitorio|muro|pared)\b/.test(normalized)) {
      const dimensions = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:x|por)\s*(\d+(?:[.,]\d+)?)\s*(?:m|metros?)\b/);
      const heightMatch = normalized.match(/(\d+(?:[.,]\d+)?)\s*(?:m|metros?)?\s*de\s*alt[oa]\b/) || normalized.match(/\balt[oa]\s*(?:de\s*)?(\d+(?:[.,]\d+)?)/);
      const height = heightMatch ? Number(heightMatch[1].replace(",", ".")) : 2.4;
      const coatsMatch = normalized.match(/(\d+)\s*manos?\b/);
      const coats = coatsMatch ? Math.max(1, Math.min(4, Number(coatsMatch[1]))) : 2;
      const wallArea = dimensions
        ? 2 * (Number(dimensions[1].replace(",", ".")) + Number(dimensions[2].replace(",", "."))) * height
        : 40;
      // Rendimiento de referencia: 35 m² por galón por mano.
      const gallons = Math.max(1, Math.min(8, Math.ceil((wallArea * coats) / 35)));
      return {
        route: "suggestions",
        project: "Pintar una habitación",
        note: dimensions
          ? `Estimación para una habitación de ${dimensions[1]} × ${dimensions[2]} m y ${height.toLocaleString("es-CL")} m de alto: ${wallArea.toLocaleString("es-CL", { maximumFractionDigits: 1 })} m² de muro, ${coats} manos.`
          : "Estimación inicial para una habitación mediana. Confirma superficie y número de manos antes de comprar.",
        items: [
          { sku: "paint", quantity: gallons },
          { sku: "roller", quantity: 1 },
          { sku: "tray", quantity: 1 },
          { sku: "tape", quantity: 2 },
          { sku: "sandpaper", quantity: 2 },
        ],
      };
    }

    if (/\b(reparar|resanar|arreglar)\b/.test(normalized) && /\b(pared|muro|grieta|hoyo)\b/.test(normalized)) {
      return {
        route: "suggestions",
        project: "Reparar una pared",
        note: "Lista inicial para una reparación pequeña. El material de resane puede variar según el tamaño y la profundidad del daño.",
        items: [
          { sku: "patch", quantity: 1 },
          { sku: "trowel", quantity: 1 },
          { sku: "sandpaper", quantity: 3 },
          { sku: "brush", quantity: 1 },
          { sku: "paint", quantity: 1 },
        ],
      };
    }

    return parseMaterialRequest(normalized);
  }

  function parseMaterialRequest(normalized) {
    const unsupported = normalized.match(UNSUPPORTED_PRODUCTS);
    if (unsupported) {
      return { route: "clarify", reason: `No reconocí “${unsupported[0]}” en el catálogo. No guardaré una cotización incompleta.` };
    }
    const mentioned = PRODUCT_REQUESTS.filter(({ names }) => names.test(normalized));
    if (mentioned.length === 0) {
      return {
        route: "clarify",
        reason: "No reconocí el proyecto o los materiales. Prueba con “instalar una repisa”, “pintar una habitación” o una lista del catálogo.",
      };
    }

    const items = [];
    for (const product of mentioned) {
      const matches = [...normalized.matchAll(new RegExp(product.request.source, "g"))];
      if (matches.length !== 1) {
        return { route: "clarify", reason: "Me falta una cantidad o el mismo artículo aparece más de una vez. Aclara la lista antes de continuar." };
      }
      const quantity = parseQuantity(matches[0][1]);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
        return { route: "clarify", reason: "Usa una cantidad entre 1 y 50 para cada producto." };
      }
      items.push({ sku: product.sku, quantity });
    }

    return { route: "suggestions", project: "Lista de materiales", note: "Revisa la selección y las cantidades sugeridas antes de comprobar existencias.", items };
  }

  function checkStock(items, readInventory) {
    const stock = readInventory(items);
    const shortages = stock.filter((item) => !item.found || item.quantity > item.available);
    if (shortages.length === 0) return { route: "ready", items, stock };

    const proposal = stock.map((item) => {
      if (item.found && item.quantity <= item.available) return { sku: item.sku, quantity: item.quantity, name: item.name, unit: item.unit, available: item.available };
      if (item.alternative && item.alternative.available >= item.quantity) {
        return {
          sku: item.alternative.sku,
          quantity: item.quantity,
          name: item.alternative.name,
          unit: item.alternative.unit,
          available: item.alternative.available,
          replaces: item.name,
        };
      }
      return null;
    });

    if (proposal.some((item) => item === null)) {
      return {
        route: "clarify",
        reason: shortages.map((item) => `${item.name}: pediste ${item.quantity} ${item.unit} y hay ${item.available}.`).join(" ") + " Cambia la cantidad o elige otro material; no guardaré la cotización todavía.",
        stock,
      };
    }

    return {
      route: "approval",
      reason: shortages.map((item) => `${item.name}: hay ${item.available} ${item.unit} y pediste ${item.quantity}.`).join(" ") + " Encontré una alternativa; necesito tu aprobación para cambiar la cotización.",
      items,
      proposal,
      stock,
    };
  }

  const SUSPICIOUS_IN_FALLBACK = /\b(descuentos?|pagad[oa]s?|autorizad[oa]|asistente|agente|nota para|precio (?:cero|0))\b/;

  // Topes por ejecución (se muestran en la traza).
  const LIMITS = Object.freeze({ maxInputChars: 500, llmTimeoutMs: 12000, maxSteps: 6, maxItems: 8, maxQty: 50 });

  /**
   * Orquestador: decide el camino del agente.
   * Capa 1: reglas locales (bloquean sin gastar una llamada al modelo).
   * Capa 2: LLM en /api/plan (interpreta el proyecto, elige materiales del catálogo).
   * Capa 3: el servidor valida la respuesta del modelo (lista blanca y rangos).
   * Plan B: si el modelo no responde, usa las reglas locales y lo deja en la traza.
   */
  async function planProject(description) {
    const trace = [`Topes de esta ejecución: ${LIMITS.maxSteps} pasos, ${LIMITS.llmTimeoutMs / 1000} s para el modelo, ${LIMITS.maxItems} materiales, cantidades 1–${LIMITS.maxQty}, ${LIMITS.maxInputChars} caracteres.`];
    const normalized = normalize(description.trim());
    if (!normalized) return { result: makeProjectPlan(description), trace, source: "rules" };
    if (description.length > LIMITS.maxInputChars) {
      return { result: { route: "clarify", reason: `Describe el proyecto en menos de ${LIMITS.maxInputChars} caracteres.` }, trace: [...trace, "Entrada sobre el tope de largo."], source: "rules" };
    }
    if (hasUnsafeInstruction(normalized)) {
      trace.push("Capa 1 (reglas locales): detecté instrucciones para saltar controles. No llamé al modelo.");
      return { result: makeProjectPlan(description), trace, source: "rules" };
    }
    trace.push("Capa 1 (reglas locales): sin señales de instrucciones maliciosas. Envío la solicitud al modelo.");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LIMITS.llmTimeoutMs);
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.plan) throw new Error(data.error || `respuesta ${response.status}`);
      return { result: data.plan, trace: [...trace, ...(data.trace || [])], source: data.source || "llm", model: data.model };
    } catch (error) {
      const why = error.name === "AbortError" ? "tiempo de espera superado" : error.message;
      trace.push(`Plan B: el modelo no estuvo disponible (${why}). Usé las reglas locales del catálogo.`);
      // Sin el modelo, somos más conservadores con señales de manipulación que la capa 1 deja pasar.
      if (SUSPICIOUS_IN_FALLBACK.test(normalized)) {
        trace.push("Plan B: la solicitud trae indicaciones dirigidas al sistema (descuentos, estados de pago, roles). La detengo para revisión humana.");
        return { result: { route: "blocked", reason: "La solicitud incluye indicaciones dirigidas al sistema. Sin el modelo no puedo evaluarlas, así que la dejo para revisión de una persona." }, trace, source: "rules-fallback" };
      }
      return { result: makeProjectPlan(description), trace, source: "rules-fallback" };
    } finally {
      clearTimeout(timer);
    }
  }

  window.ElRobleAgent = Object.freeze({ makeProjectPlan, planProject, checkStock, hasUnsafeInstruction, normalize, LIMITS });
})();
