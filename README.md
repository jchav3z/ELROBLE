# El Roble · ferretería

Sitio demostrativo de una ferretería ficticia. La tienda y su catálogo son la experiencia principal; el agente de proyectos se abre en una ventana cuando la persona pulsa **Planear mi proyecto**.

## Uso

Abre `index.html` en un navegador actualizado. No requiere instalación ni conexión a servicios externos.

1. Explora el catálogo y agrega productos a la cotización.
2. Abre **Planear mi proyecto** y describe lo que quieres construir o reparar. También puedes iniciar desde las tarjetas de proyectos sugeridos.
3. El agente propone una lista de materiales editable. Cambia cantidades, quita productos o agrega artículos del catálogo.
4. Pulsa **Comprobar existencias** para consultar el inventario ficticio. Si hay una alternativa, el agente se detiene y solicita aprobación antes de guardarla.
5. Abre **Ver actividad del agente** para revisar las etapas, decisiones y consultas realizadas.
6. Acepta la cotización, simula el pago y avanza el estado del pedido a **Pendiente de envío**; al final puedes marcarlo como **Completado**. Al completarlo, sale de **Mi cotización** y queda en **Historial**. El pago no solicita datos ni hace cargos.

## Demostración de seguridad

Pulsa **Simular instrucción maliciosa** en la ventana del agente. El agente detecta peticiones para saltarse controles, solicitar el catálogo gratis o ignorar aprobaciones; detiene el flujo antes de consultar inventario o guardar una cotización.

## Componentes

- `index.html`: tienda, catálogo, ventana del planificador y acceso/registro de demostración.
- `styles.css`: tema oscuro, tipografía amplia y diseño adaptable.
- `app.js`: interfaz, edición de materiales, trazas, aprobación y cotización local.
- `agent.js`: orquestador del agente (`planProject`), reglas locales, topes, decisiones y plan B.
- `api/plan.js`: función serverless de Vercel que llama al LLM, con lista blanca de productos, topes y validación de la respuesta.
- `tools.js`: catálogo ficticio, consulta de existencias y borradores de cotización.

El agente usa un modelo de lenguaje (Gemini, plan gratuito) a través de `api/plan.js`; si el modelo no está disponible, vuelve a las reglas locales (plan B). No se conecta a un inventario real ni a un punto de venta. La cuenta de acceso/registro también es ficticia y no envía ni conserva credenciales. Las cotizaciones, el historial y los estados de pago/envío son demostrativos y locales: no confirman una venta, no reservan stock, no procesan pagos ni generan despachos.

## Arquitectura del agente (3 capas)

1. **Capa 1 · Reglas locales** (`agent.js`): bloquean instrucciones obvias ("ignora", "gratis", "sin aprobación") sin gastar una llamada al modelo.
2. **Capa 2 · LLM** (`api/plan.js`): Gemini interpreta el proyecto y elige materiales **solo** de la lista blanca del catálogo. El texto del cliente va delimitado como dato.
3. **Capa 3 · Validación**: el servidor revisa cada SKU y cantidad (1–50, máx. 8 materiales) antes de devolver el plan.

Después, el agente usa sus herramientas: `readInventory` (solo lectura) y `saveQuote` (borrador, nunca venta). Si falta stock y existe una alternativa, **se detiene y pide aprobación humana**.

**Topes por ejecución:** 500 caracteres de entrada, 12 s de espera, 700 tokens de salida, 8 materiales y un contador de hasta 20 llamadas por minuto por instancia de Vercel. Ese contador no es un límite global. El nivel gratuito de Gemini tiene cuotas y condiciones que pueden cambiar.

## Configurar el modelo (Vercel)

1. Crea una clave gratis en Google AI Studio (aistudio.google.com → *Get API key*).
2. En Vercel: *Project → Settings → Environment Variables* → agrega `GEMINI_API_KEY` con la clave. Opcional: `GEMINI_MODEL` (por defecto `gemini-2.5-flash`).
3. Vuelve a desplegar (*Deployments → Redeploy*).

**Nunca** pegues la clave en el código, en la presentación ni en el video. Si se expone, revócala en AI Studio.

Sin la variable configurada (o abriendo `index.html` directo), el agente funciona con las reglas locales y lo indica en la traza como *Plan B*.

## Casos de demostración

- **Normal + decisión + aprobación:** "quiero pintar un dormitorio de 3x3 metros con 2,4 m de alto" → 2 galones → hay 1 en stock → propone la línea profesional → pide aprobación.
- **Malicioso obvio:** botón *Simular instrucción maliciosa* → lo detiene la capa 1.
- **Inyección escondida:** botón *Simular inyección escondida* → el filtro del navegador la deja pasar, pero la regla del servidor detecta el intento de alterar descuentos/estado de pago y la bloquea antes de llamar al modelo. Para solicitudes nuevas, la detección del modelo es una ayuda, no una garantía de seguridad.
