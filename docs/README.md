# Mapa de la documentación

| Área | Contenido y fuente de verdad |
| --- | --- |
| [00 · Coordinación](00-coordinacion/README.md) | Contexto confirmado, preguntas, prioridades y forma de trabajar. |
| [01 · Negocio](01-negocio/README.md) | Clientes, servicios, cobertura y políticas comerciales. |
| [02 · Operaciones](02-operaciones/README.md) | Reserva, viaje, vehículo, bienestar, limpieza e incidentes. |
| [03 · Finanzas y precios](03-finanzas/README.md) | Costos, rentabilidad, tarifas y reglas de cotización. |
| [04 · Marca](04-marca/README.md) | Nombre, posicionamiento, identidad visual y activos de marca. |
| [05 · Marketing y ventas](05-marketing/README.md) | Canales, campañas, alianzas, contenidos y resultados comerciales. |
| [06 · Producto digital](06-producto-digital/README.md) | Experiencia del cliente, contenido y diseño funcional de la web. |
| [07 · Tecnología](07-tecnologia/README.md) | Implementación de web, reservas, pagos, datos, seguridad e integraciones. |
| [08 · Administración y legal](08-administracion-legal/README.md) | Trámites por verificar, seguros, contratos, registros e impuestos. |
| [09 · Investigación](09-investigacion/README.md) | Entrevistas, observación de competidores y validación de hipótesis. |

## Regla para ubicar una idea

Una decisión se registra en el área que la gobierna. Por ejemplo:

- **Cuánto cobrar, cuándo pedir seña y cómo reembolsar:** `03-finanzas/` y `01-negocio/`.
- **Cómo se cobra en la web y qué proveedor procesa el pago:** `07-tecnologia/`.
- **Aspecto del logo, colores y tipografías:** `04-marca/`.
- **Diseño del formulario y recorrido de reserva:** `06-producto-digital/`.
- **Código, despliegue y base de datos:** `07-tecnologia/`.
- **Promesas publicitarias, redes, Google y alianzas:** `05-marketing/`.
- **Qué equipo se usa en la camioneta y qué ocurre en cada viaje:** `02-operaciones/`.

Si un tema afecta a varias áreas, se escribe una vez en su fuente de verdad y se enlaza desde las otras. Cada área guarda sus propias decisiones en `decisiones.md` para poder revisar el motivo y la fecha de cada elección.

## Convenciones

- Archivos Markdown con nombres en español, minúsculas y guiones: `costos-del-vehiculo.md`.
- Etiquetas de estado: **Confirmado**, **Propuesta**, **Por definir**, **Por verificar** o **Descartado**. Una propuesta nunca se presenta como política vigente.
- Cada decisión debe incluir fecha, alternativa elegida, motivo y consecuencias. Hay una [plantilla](00-coordinacion/plantilla-de-decision.md).
- Las cifras llevan moneda, fecha y fuente. Los cálculos llevan supuestos y un ejemplo reproducible.
- Los datos personales de clientes y mascotas, claves y credenciales no se guardan en este repositorio. Los documentos pueden contener ejemplos ficticios.
- Los documentos comerciales, legales y de seguridad se revisan antes de publicarlos o aplicarlos.

## Cómo avanzamos

1. Responder las [preguntas prioritarias](00-coordinacion/preguntas-prioritarias.md).
2. Actualizar el documento del área correspondiente y registrar cualquier decisión tomada.
3. Revisar las dependencias: una promesa de marketing o una función de la web debe reflejar una política y una operación que realmente podamos cumplir.
4. Pasar a [la hoja de ruta](00-coordinacion/hoja-de-ruta.md) para elegir el siguiente tema.
