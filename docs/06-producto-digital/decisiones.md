# Decisiones de diseño del producto digital

Registro de decisiones sobre recorrido, formularios, navegación, accesibilidad, presentación y prioridades de la web. Usar la [plantilla común](../00-coordinacion/plantilla-de-decision.md).

## 2026-11-13 · Estructura inicial de la portada

- Estado: aprobada como primera estructura; maqueta visual pendiente de revisión.
- Decisión: portada dirigida a tutores particulares, con Montevideo como foco, viajes al interior como opción secundaria y consulta principal por WhatsApp.
- Motivo y evidencia: respuestas del emprendedor a las preguntas de `impeccable shape` y confirmación posterior del [bosquejo](bosquejo-inicio.md).
- Consecuencia: desarrollar la [primera maqueta visual](../../apps/web/README.md) sobre esa secuencia.

## 2026-11-14 · Mensaje de confianza y cupo

- Estado: dirección de contenido confirmada; texto final de la web pendiente de revisión.
- Decisión: destacar un traslado seguro, a cargo de personas que aman a los animales, y un cupo de hasta 2 perros y 2 gatos por viaje.
- Presentación: mostrar una foto real del vehículo cuando esté disponible, sin describir modelo ni colores ni detallar en la página la sujeción o distribución interna. Esos datos quedan en [Operaciones](../02-operaciones/vehiculo-y-equipamiento.md).
- Evidencia: indicaciones del emprendedor del 2026-11-14. También confirmó caniles separados para los perros y equipamiento ya instalado y probado.

## 2026-11-14 · Recorrido ilustrativo interactivo

- Estado: prototipo actualizado según los comentarios del emprendedor; pendiente de revisión visual final.
- Dirección: una escena central propia compuesta por dos capas independientes: camioneta gris con cúpula oscura detrás y un recorte grande del perro sonriente encima, saliendo de la silueta del vehículo. Es un montaje expresivo, no una representación literal del traslado.
- Interacción: la camioneta comienza en Origen y recorre el trazado al bajar. La escena queda fija durante el trayecto y el contenido siguiente aparece al llegar a Destino. Al subir, la camioneta conserva la posición alcanzada; al terminar, se puede repetir desde Origen.
- Accesibilidad: con reducción de movimiento, la camioneta espera quieta en Origen y se ofrece «Activar recorrido con scroll» como acción voluntaria.
- Fuente: [referencia de recorrido](../04-marca/referencias/08-recorrido-animado.png) e indicación del emprendedor; no es un mapa ni una ruta real.

## 2026-11-15 · Explicaciones de cada etapa del recorrido

- Estado: solicitado por el emprendedor e incorporado a la maqueta.
- Decisión: renombrar «Salida» como «Origen» y usar el texto inferior para explicar por qué se piden origen, cantidad de mascotas y destino. El texto cambia al alcanzar cada etapa, mientras los globos conservan las preguntas breves.
- Fuente: textos indicados por el emprendedor el 2026-11-15. La afirmación de que el precio no varía por cantidad también se registra en [Finanzas](../03-finanzas/precios.md).

## 2026-11-16 · Voz cercana para toda la web

- Estado: aplicada a la maqueta; pendiente de revisión del emprendedor.
- Decisión: usar voseo rioplatense de forma consistente, con frases directas y naturales. Hablarle a la persona que necesita el traslado, explicar lo que sí sabemos y evitar promesas o procesos todavía no definidos.
- Alcance: portada, recorrido animado, tipos de viaje, cuidado, coordinación, cobertura, preguntas, contacto y mensajes de la vista previa.
- Fuente: pedido del emprendedor de que los textos suenen como él habla y no como una web genérica. Los ejemplos y términos se registran en [Contenido de la web](contenido-web.md).

## 2026-11-16 · Título y mensajes del recorrido

- Estado: aplicado a la maqueta y comprobado en escritorio y móvil.
- Decisión: «Para empezar,» aparece en verde oscuro y «contanos tres cosas.» en verde. El título permanece visible junto al mapa durante el desplazamiento de la camioneta y se libera al terminar la sección.
- Globos: «¿Desde dónde salen?», «¿Cuántos viajan?» y «¿A dónde van?». El texto verde inferior se desvanece y reaparece al cambiar de etapa; con movimiento reducido cambia sin animación.
- Fuente: indicaciones del emprendedor del 2026-11-16.

## 2026-11-16 · Formulario compartido para consultar viajes

- Estado: implementado y probado en la maqueta en escritorio y móvil; el resultado inicial de copia fue sustituido por la apertura de WhatsApp según la decisión posterior del mismo día.
- Decisión: las tarjetas «Montevideo» e «Interior» usan el mismo botón «Consultar viaje» y el mismo modal. El formulario pide origen, cantidad de mascotas, destino, fecha en un calendario propio, ida y vuelta y tiempo de espera solo cuando se elige «Sí».
- Resultado inicial: la consulta se podía copiar sin salir del sitio. El proceso comercial sigue abierto y la web no crea una reserva.
- Fuente: indicaciones del emprendedor del 2026-11-16.

## 2026-11-16 · Fotografía del vehículo en la sección de cuidado

- Estado: integrada en la maqueta y revisada en escritorio y móvil; los recuadros de fotos pendientes se recuperaron según la decisión posterior del mismo día.
- Decisión: usar una versión editada de una foto propia del vehículo como imagen principal.
- Procedencia y límite: [originales y versión editada](../04-marca/activos/fotografias/README.md). El fondo de la versión editada fue reconstruido; la imagen no documenta un lugar real ni el equipamiento interior.
- Fuente: dos imágenes aportadas por el emprendedor el 2026-11-16 y pedido de mejorar su presentación en la web.

## 2026-11-16 · Envío por WhatsApp y espacios para próximas fotos

- Estado: implementado en la maqueta.
- Decisión: «Enviar consulta» abre el chat de WhatsApp del número `099553986` (`+59899553986` en formato internacional) con un mensaje precargado que incluye los datos del viaje y pregunta por disponibilidad y precio. WhatsApp requiere que la persona pulse Enviar. Los demás botones de WhatsApp también abren ese número.
- Presentación: conservar la foto editada de la camioneta y restituir los espacios «Espacio preparado» y «Personas detrás del viaje» para incorporar imágenes propias más adelante.
- Fuente: indicaciones del emprendedor del 2026-11-16.

## 2026-11-16 · Imagen conceptual del espacio preparado

- Estado: integrada en la maqueta la versión con perro; la variante con el canil vacío queda disponible como alternativa.
- Decisión: mostrar la camioneta desde atrás, con la caja abierta, un canil negro de barrotes finos y un colchoncito; las ventanas de la cúpula quedan ligeramente abiertas. En una versión aparece un perro mediano mestizo descansando dentro del canil.
- Procedencia y límite: [ambas imágenes](../04-marca/activos/fotografias/README.md) fueron generadas a partir de referencias del exterior de la camioneta. No documentan el equipamiento real ni su instalación.
- Fuente: indicaciones del emprendedor del 2026-11-16.

## 2026-11-16 · Texto sobre traslado de perros y gatos

- Estado: aplicado en la sección de cuidado y en la respuesta de preguntas frecuentes.
- Decisión: explicar que los perros viajan en caniles cerrados dentro de la cúpula, con ventilación; cada gato viaja en un transportín sujeto con cinturón de seguridad en el asiento trasero de la camioneta. El dueño debe proporcionar el transportín.
- Fuente: indicaciones del emprendedor del 2026-11-16.
