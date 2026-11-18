# Estructura de precios

Estado: **Fórmula de Montevideo implementada; precio de interior pendiente**.

## Reglas indicadas para una etapa posterior

Para **Montevideo**, el emprendedor indicó el 2026-11-17 una mano de obra de **UYU 400 por hora** de conducción y espera, un recargo de **30 % sobre la suma de nafta y mano de obra**, y un precio mínimo de **UYU 600**. Se suman todos los tramos del vehículo desde la base y de regreso a ella. La fórmula vigente en la maqueta es:

```text
mano_obra = 400 × (segundos_de_conducción + 60 × minutos_de_espera) / 3600
costo_total = costo_de_nafta + mano_obra
precio_Montevideo = máximo(600, costo_total × 1,30)
```

En ida y vuelta, el formulario incluye **60 minutos de espera en la cotización** y pide solamente los minutos adicionales. Para el cálculo, `minutos_de_espera = 60 + minutos_adicionales`. Toda esa espera entra en el costo de mano de obra: la primera hora está incluida en el precio del viaje, sin un cargo separado, y los minutos adicionales aumentan el costo calculado. El precio de venta se muestra con dos decimales, sin redondear los componentes antes de aplicar el 30 % y el mínimo. La carga y descarga no forman parte del tiempo estimado por Google ni del costo de mano de obra calculado.

El porcentaje del **interior** y la inclusión de peajes siguen pendientes; por eso esos viajes conservan la consulta manual. El descuento para seguidores de Instagram también queda pendiente. En todos los casos la disponibilidad y el importe se confirman por WhatsApp.

## Cantidad de mascotas

El emprendedor indicó el 2026-11-15 que **el precio no varía según la cantidad de mascotas que viajan**. La cantidad se pregunta para organizar el traslado. Esta regla se entiende dentro del cupo declarado de hasta 2 perros y 2 gatos; las condiciones de admisión y los demás componentes del precio siguen pendientes.

## Componentes posibles

- Tarifa mínima que cubra viajes cortos y la gestión de la reserva.
- Distancia facturable: ida, retorno y tramos sin mascota según la política elegida.
- Tiempo de viaje, carga/descarga y espera que exceda lo incluido.
- Peajes, estacionamiento y otros gastos directos conocidos antes de confirmar.
- Recargos justificados: horario especial, urgencia, viaje interurbano o necesidades operativas adicionales.
- Descuentos o paquetes para clientes frecuentes, si son rentables.
- Comisiones, impuestos aplicables y margen deseado.

## Reglas que deben comunicarse al cliente

Antes de aceptar un viaje, el cliente debe poder conocer el precio total o las condiciones exactas que podrían cambiarlo. Definir la vigencia del presupuesto, el tratamiento de cambios de ruta y las condiciones de cancelación en [Políticas comerciales](../01-negocio/politicas-comerciales.md).

## Pendientes de decisión

Porcentaje del interior, peajes, gastos del vehículo aún no medidos, carga y descarga, redondeo comercial del precio final, vigencia de cotizaciones, descuentos y condiciones especiales. Los valores aprobados se anotarán aquí con fecha de vigencia y versión de la tabla de precios.
