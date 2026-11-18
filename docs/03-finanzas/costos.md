# Costos del servicio

Estado: **Calculadora local de combustible y mano de obra implementada; otros costos pendientes**.

## Combustible: primera etapa

- Base operativa: la dirección indicada por el emprendedor en Montevideo, guardada solo en el servidor local.
- Rendimientos medidos e informados por el emprendedor: **11 km/l** dentro del departamento de Montevideo y **15 km/l** fuera de él.
- Precio informado como efectivamente pagado: **UYU 95/l de Súper 95**. Se actualiza en `.env` y requiere reiniciar la web.
- Se suman todos los tramos del vehículo desde la base hasta la recogida, las entregas y el regreso a la base. Una vuelta termina en el origen inicial salvo que se indique otra dirección.
- `litros = km_en_Montevideo / 11 + km_fuera_de_Montevideo / 15`; `costo_nafta_UYU = techo(litros × 95)`. Los kilómetros se conservan sin redondear hasta el resultado.
- La ruta recomendada de Google se divide con el límite departamental oficial del IGM. La espera ocurre con el motor apagado y no cambia el combustible calculado.

El costo interno mostrado suma **nafta y mano de obra a UYU 400/h**, incluyendo toda la conducción y la espera prevista en una ida y vuelta. Los peajes de interior quedan pendientes. Tampoco se computan seguro, patente, depreciación, mantenimiento, neumáticos, limpieza, estacionamiento, carga y descarga ni otros gastos fijos.

| Grupo | Ejemplos a medir | Unidad sugerida |
| --- | --- | --- |
| Vehículo fijo | Seguro, patente, financiación, depreciación, estacionamiento fijo. | Por mes o año |
| Vehículo variable | Combustible, neumáticos, mantenimiento, peajes, estacionamiento por viaje. | Por km o viaje |
| Operación | Limpieza, consumibles, equipamiento, reposición, teléfono. | Por viaje o mes |
| Venta y cobro | Publicidad, comisiones de pago, web, dominio, herramientas. | Por reserva o mes |
| Trabajo | Conducción, espera, carga/descarga, administración y atención. | Por hora |
| Obligaciones | Impuestos, aportes, asesoría y otros costos confirmados localmente. | Según corresponda |

## Datos para reunir

1. Gasto real del vehículo durante los últimos meses, si existe registro.
2. Consumo de combustible en ciudad y ruta, precio por litro y kilómetros en vacío.
3. Kilómetros y horas disponibles al mes para este negocio.
4. Inversión necesaria para acondicionar el vehículo y equiparlo.
5. Ingreso objetivo del emprendedor y fondo para mantenimiento e imprevistos.

Separar **costo** de **precio**: la calculadora actual cubre solo nafta; [Precios](precios.md) define lo que se cobrará cuando se aprueben las tarifas.
