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
- `agent.js`: interpretación local de proyectos, controles y decisiones.
- `tools.js`: catálogo ficticio, consulta de existencias y borradores de cotización.

El agente es una demostración local basada en reglas; no se conecta a un modelo de lenguaje, inventario real ni punto de venta. La cuenta de acceso/registro también es ficticia y no envía ni conserva credenciales. Las cotizaciones, el historial y los estados de pago/envío son demostrativos y locales: no confirman una venta, no reservan stock, no procesan pagos ni generan despachos.
