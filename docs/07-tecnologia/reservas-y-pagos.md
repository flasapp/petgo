# Reservas y pagos: implementación

Estado: **Flujo visual de consulta en la maqueta; reservas y pagos por definir**.

## Reservas

Decidir si las solicitudes llegan por WhatsApp, formulario o sistema de agenda. Documentar estados como consulta, cotizada, pendiente de confirmación, confirmada, completada y cancelada, junto con quién puede mover una reserva de un estado a otro.

En la maqueta, las tarjetas Montevideo e Interior comparten un modal. Pide origen, destino, fecha, ida y vuelta y tiempo de espera condicional; el campo de cantidad de mascotas está comentado y el encabezado recuerda que hasta 2 perros y 2 gatos están incluidos. Al completarlo abre `wa.me/59899553986` con el texto del viaje y una pregunta por disponibilidad y precio; la persona debe enviarlo desde WhatsApp. El número local es `099553986`. La web no almacena datos, no consulta disponibilidad y no crea una reserva. El calendario personalizado está implementado en `apps/web/public/trip-form.js`, sin dependencia externa.

La disponibilidad, anticipación mínima, cancelaciones y seña son reglas de [Negocio](../01-negocio/politicas-comerciales.md). La fórmula de precio pertenece a [Finanzas](../03-finanzas/algoritmo-de-cotizacion.md).

## Pagos

Cuando se conozcan los medios aceptados, evaluar proveedor, comisiones, cobertura local y requisitos técnicos. Documentar inicio del cobro, confirmación, fallos, duplicados, devoluciones, comprobante y conciliación con cada reserva.

No almacenar datos sensibles de tarjeta en código o documentos del proyecto. Las credenciales y claves deben gestionarse mediante el mecanismo seguro del proveedor elegido.
