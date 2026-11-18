# Algoritmo de cotización

Estado: **Precio de Montevideo implementado; interior en consulta manual**.

## Cálculo implementado

La maqueta local obtiene kilómetros y duración estimada por carretera de Google Maps para el circuito completo desde la base y de regreso a ella. Separa kilómetros dentro y fuera del departamento de Montevideo con el límite oficial y calcula litros/costo según [Costos](costos.md). Para un viaje dentro de Montevideo, suma ese costo a la mano de obra de UYU 400/h sobre toda la conducción y toda la espera prevista, aplica 30 % al costo total y después el mínimo de UYU 600, según [Precios](precios.md). En ida y vuelta, la cotización incluye 60 minutos de espera y el formulario pide solo los minutos adicionales; el cálculo usa la suma de ambos. Usa una ruta sin tráfico en tiempo real; la espera y la carga y descarga no forman parte de la duración que devuelve Google. Los viajes al interior conservan el desglose de costos pero requieren cotización manual hasta definir porcentaje y peajes. Si falla una dirección, la ruta o el cupo de Google, se conserva la consulta manual por WhatsApp. El desglose se muestra solo en la maqueta local y **no se incluye en el mensaje al cliente**.

El precio de Montevideo se muestra en el modal para revisión y se confirma junto con la disponibilidad por WhatsApp.

## Entradas

Origen, destino, fecha y hora, tipo de servicio, ida o ida y vuelta, cantidad y especie de mascotas (cupo declarado de hasta 2 perros y 2 gatos), tamaños y necesidades especiales, tiempo estimado, distancia estimada, peajes y estacionamiento, espera solicitada y zona de cobertura. La cantidad sirve para organización y comprobación del cupo; [no modifica el precio](precios.md#cantidad-de-mascotas), según indicó el emprendedor.

## Flujo propuesto

1. Comprobar que el servicio, el horario y las condiciones de transporte son admisibles. Si faltan datos, pedir revisión manual.
2. Estimar los kilómetros y minutos que realmente consumirá el viaje, incluido el desplazamiento sin mascota si la política aprobada lo contempla.
3. Calcular un subtotal con tarifa de salida, distancia, tiempo, espera y extras aprobados.
4. Aplicar el mínimo del servicio, redondeo y reglas de descuentos o recargos.
5. Verificar que el precio cubra costos, comisiones, obligaciones aplicables y margen objetivo. Si no, revisar tarifas o condiciones.
6. Mostrar desglose, precio final, vigencia de la cotización y condiciones de cambio.

Fórmula de Montevideo:

```text
nafta = techo(95 × (km_Montevideo / 11 + km_fuera / 15))
mano_obra = 400 × (segundos_conducción / 3600 + minutos_espera / 60)
costo_total = nafta + mano_obra
precio_Montevideo = máximo(600, costo_total × 1,30)
```

Las tarifas deben calibrarse con [Costos](costos.md). El tiempo y la distancia que se cobran al cliente deben coincidir con [Políticas comerciales](../01-negocio/politicas-comerciales.md).

## Casos de prueba que documentaremos

- Viaje corto por debajo de la tarifa mínima.
- Ida simple con retorno del conductor sin mascota.
- Ida y vuelta con espera.
- Viaje fuera de zona o con peajes.
- Un viaje con varias mascotas, dentro del cupo declarado, sin recargo por cantidad.
- Cambio de destino u horario después de cotizar.
- Datos incompletos o condiciones que exigen revisión manual.

Cada caso tendrá entradas, desglose esperado y precio final en la moneda elegida cuando se aprueben las tarifas.
