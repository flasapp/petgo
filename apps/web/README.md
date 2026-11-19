# GoPet · primera maqueta visual de la web

Prototipo estático de la portada confirmada en [el brief](../../docs/06-producto-digital/bosquejo-inicio.md). Para verlo localmente, desde `apps/web/`:

```bash
npm run dev
```

Abrir `http://127.0.0.1:5173` en el navegador. Para usar otro puerto: `PORT=5174 npm run dev`. No abrir `apps/web/public/index.html` directamente ni con Live Server: esas vistas dejan `__TURNSTILE_SITE_KEY__` sin reemplazar y no pueden consultar la API local. Requiere Node.js 18 o posterior y `npm install` antes del primer uso. Diseñado para escritorio y móvil; **no es una web publicada ni un sistema de reservas**.

## Despliegue en Dokploy

Crear una **Application** conectada al repositorio y la rama que se va a publicar. Elegir **Dockerfile** como tipo de build y configurar:

| Campo | Valor |
| --- | --- |
| Build Path | `/apps/web` |
| Dockerfile Path | `Dockerfile` |
| Docker Context Path | `.` |
| Puerto del dominio | `5173` |

Dokploy construye la imagen con el `pnpm-lock.yaml` versionado. El Dockerfile escucha en `0.0.0.0:5173` dentro del contenedor; en el desarrollo local el servidor sigue limitado a `127.0.0.1`. En **Environment**, cargar las variables de `.env.example` con los valores reales, especialmente las claves de Google y Turnstile y `BASE_PLACE_ID`. Son variables de ejecución: el archivo `.env` local no se copia a la imagen ni debe subirse al repositorio. Si Turnstile está activo, agregar el dominio publicado a sus hostnames autorizados.

En **Advanced → Mounts**, crear un *Volume Mount* persistente con destino `/app/.gopet-local` y permiso de escritura para el usuario `node` (UID 1000). Ahí se conserva el contador mensual de solicitudes a Google entre despliegues. Mantener también los límites configurados en Google Cloud.

Si ya hay un volumen montado para el contador, conservar el mismo volumen y cambiar su destino a `/app/.gopet-local` antes del próximo despliegue. Comprobar que `google-usage.json` sigue en la raíz del volumen; de otro modo, el cupo mensual comenzaría de cero. En desarrollo local el archivo existente ya se trasladó a la nueva carpeta.

Con GitHub conectado mediante la integración de Dokploy, los pushes a la rama configurada disparan el despliegue automático. Con otros proveedores, activar **Auto Deploy** y configurar el webhook de Dokploy. Referencias: [tipo de build](https://docs.dokploy.com/docs/core/applications/build-type), [despliegue automático](https://docs.dokploy.com/docs/core/auto-deploy) y [volúmenes](https://docs.dokploy.com/docs/core/applications/advanced).

## Cálculo local de costos y precio

Instalar dependencias con `npm install`. Copiar `.env.example` a `.env` en `apps/web/` y pegar la clave después de `GOOGLE_MAPS_API_KEY=`; guardar y reiniciar `npm run dev`. La clave requiere un proyecto Google Maps Platform con facturación y Places API (New) y Routes API habilitadas. La base se resuelve mediante el `BASE_PLACE_ID` configurado, sin Geocoding API. `.env` está excluido de Git; no poner la clave en `public/` ni compartirla en el chat. Las tarifas, rendimientos, precio de nafta, mínimo, recargo, número de WhatsApp, base, puerto y cupo local se leen de `.env` al arrancar. Configurar cuotas diarias por API en Google Cloud bajo los [cupos sin cargo vigentes](https://developers.google.com/maps/billing-and-pricing/pricing); el servidor además detiene cada tipo de solicitud según `GOOGLE_MONTHLY_LIMIT` y guarda su contador en `.gopet-local/`. El cupo sin cargo depende de la cuenta de facturación y puede cambiar.

Después de verificar a la persona, el formulario ofrece sugerencias de direcciones uruguayas después de escribir al menos tres letras y dejar de tipear durante 700 ms. Al cotizar el viaje con direcciones sugeridas, el servidor obtiene los kilómetros y el tiempo estimado por carretera sin exponer la dirección de la base. Mientras calcula, `/api/fuel-estimate-stream` envía el avance de direcciones y tramos completados; el modal mueve la camioneta y el perro continuamente, con los eventos del servidor como guía, sin depender del scroll. Con movimiento habilitado, recorrer de inicio a fin lleva al menos dos segundos, aunque la respuesta llegue antes. El endpoint JSON `/api/fuel-estimate` también exige verificación. El [límite departamental oficial del IGM](https://sit.mvot.gub.uy/arcgis/rest/services/07_EXTERNO/LIMITES_ADMINISTRATIVOS/MapServer/layers) se conserva en `data/montevideo.geojson`; separar la ruta en ambos lados del límite permite calcular nafta según los rendimientos y el precio por litro de `.env`. El modal presenta al cliente su trayecto, lo que incluye y el precio aproximado de Montevideo; el desglose de costos y los tramos operativos quedan fuera de la interfaz. En ida y vuelta incluye 60 minutos de espera y pide solo los minutos adicionales. El precio se redondea hacia arriba al siguiente múltiplo de UYU 5 y se agrega al mensaje de WhatsApp. El tiempo de conducción no incluye tráfico en tiempo real. En interior faltan porcentaje y peajes, por lo que el precio se consulta manualmente. Si Google no está configurado, no hay ruta o se agota el cupo, WhatsApp permanece disponible sin cálculo.

### Mapa y protección de las consultas

`ENABLE_MAP=true` muestra el mapa de Google en la cotización; si falta o tiene otro valor, el servidor no entrega su URL y el navegador no carga el mapa. `ENABLE_MESSAGE=true` muestra la vista previa del mensaje y «Copiar consulta»; si falta o tiene otro valor, esos elementos se ocultan y la fecha y hora de salida aparecen debajo de «Tu trayecto». El mensaje para WhatsApp se sigue preparando en ambos casos. Ambas variables están en `.env.example` con valor `false`; cambiar `.env` y reiniciar el servidor para activarlas.

Para activar el mapa del modal con la misma `GOOGLE_MAPS_API_KEY`, [habilitar **Maps Embed API**](https://developers.google.com/maps/documentation/embed/get-api-key) en el proyecto de Google Cloud. Luego abrir esa clave en **Google Maps Platform → Credentials** y, si tiene **API restrictions**, agregar **Maps Embed API** sin quitar **Places API (New)** ni **Routes API**. Habilitar la API y permitirla en la clave son dos pasos distintos. Una restricción de aplicación a **IP addresses** bloquearía el mapa del navegador; una restricción a **Websites** bloquearía las solicitudes del servidor. Para usar una sola clave en ambos lugares, dejar **Application restrictions: None** y mantener las restricciones por API y las cuotas de Google Cloud. [Google explica las restricciones de aplicación](https://developers.google.com/maps/api-security-best-practices).

El servidor entrega la URL del mapa solo después de una cotización verificada; el mapa muestra origen → destino y Google puede elegir un trazado visual distinto del usado para cotizar. [Maps Embed API no tiene cargo por uso](https://developers.google.com/maps/documentation/embed/usage-and-billing), aunque requiere facturación habilitada. La clave queda visible en el navegador cuando se carga el mapa y puede usarse directamente contra las APIs que tenga autorizadas, sin pasar por los límites de este servidor. Vigilar las cuotas y el uso de la clave en Google Cloud.

`CHEK_IS_HUMAN=true` muestra [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/get-started/) y exige su verificación para buscar direcciones y cotizar, tanto en el modal como en los endpoints JSON. Si faltan las claves de Turnstile, las llamadas a Google quedan bloqueadas y sigue disponible la consulta manual por WhatsApp. `CHEK_IS_HUMAN=false` oculta el widget y permite búsquedas y cotizaciones sin verificación; no carga el script de Cloudflare. La opción predeterminada es `true`. Reiniciar el servidor tras cambiar `.env`. El cupo local y las cuotas de Google Cloud siguen aplicándose en ambos modos.

Para usar `true`, crear un widget de Turnstile para el dominio de la web y completar `TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY` en `.env`. En pruebas locales, agregar a **Settings → Hostname Management → Add Hostnames** el host exacto de la URL: `127.0.0.1` si se abre `http://127.0.0.1:5173`, o `localhost` si se abre `http://localhost:5173`. No incluir `http://`, el puerto ni la ruta. El servidor valida el token con Cloudflare, comprueba el dominio y entrega una sesión de diez minutos. Cada sesión admite hasta 40 búsquedas de direcciones y tres cotizaciones. El CAPTCHA reduce abuso automatizado, pero conviene mantener también las cuotas de Google Cloud.

Comprobar el cálculo puro con `npm test`. Para validar direcciones y rutas reales hace falta la clave configurada.

Si `/api/places` devuelve **503**, comprobar que `.env` contiene la clave después del signo `=` y reiniciar `npm run dev`. El servidor lee el archivo al arrancar. Si `/api/fuel-estimate` devuelve **422** porque Google identificó una calle o zona sin punto exacto, elegir una dirección con número, una esquina o un lugar concreto de las sugerencias; una calle completa no permite asignar kilómetros confiables. Un **503** indica que alguna API de Google no está disponible y el mensaje señala cuál revisar.

## Lo provisional

- GoPet es el nombre de trabajo elegido por el emprendedor el 2026-11-19. El [logo PNG transparente](../../docs/04-marca/activos/logo/README.md) muestra una camioneta con un perro y un gato; la disponibilidad registral y digital del nombre sigue sin verificar.
- Los botones de WhatsApp abren el chat del número del emprendimiento (`099553986`, Uruguay; `+59899553986` en formato internacional).
- Los botones «Cotizar viaje» del hero, las tarjetas y la sección de contacto abren un [formulario compartido](public/trip-form.js) con un único campo de fecha y hora. El calendario se muestra con [Flatpickr](package.json), en español y con estilos de GoPet; sus archivos están guardados en `public/vendor/flatpickr` para que la maqueta funcione sin CDN. El formulario muestra el cálculo disponible y prepara la consulta para WhatsApp con los datos del viaje y las preguntas por disponibilidad y precio. La persona debe pulsar Enviar en WhatsApp; esto no confirma una reserva. El número se configura en `data-whatsapp-number` dentro de `public/index.html`.
- La sección de cuidado usa una [foto propia editada del exterior de la camioneta y una imagen generada del espacio preparado](../../docs/04-marca/activos/fotografias/README.md). El espacio para una futura foto de las personas responsables sigue visible.
- El texto visible explica que los perros viajan en caniles cerrados y ventilados dentro de la cúpula, y que cada gato viaja en su transportín, proporcionado por el dueño y sujeto con cinturón en el asiento trasero. Los detalles técnicos pendientes están en [Operaciones](../../docs/02-operaciones/vehiculo-y-equipamiento.md).
- Los textos del proceso, preguntas y condiciones deben revisarse al cerrar las políticas comerciales y operativas.
- Fredoka y Nunito Sans se cargan desde Google Fonts para la prueba visual; aún no están aprobadas como tipografías de marca.

## Recorrido animado

La escena de viaje de `public/index.html` combina un recorrido SVG original con **dos imágenes transparentes independientes**: `public/assets/camioneta-base.png` detrás y `public/assets/perro-sonriente-recorte.png` encima de la cúpula. El perro se sale deliberadamente de la silueta del vehículo; es un montaje conceptual, no una foto del traslado ni un mapa real. Ambas capas están dentro del mismo grupo SVG y avanzan juntas. `public/route-animation.js` vincula su posición y el tramo pintado al scroll. El mapa queda fijo en pantalla durante el trayecto; las tarjetas siguientes aparecen después de llegar al destino. La camioneta solo avanza al bajar: si se vuelve a subir, conserva la posición alcanzada. El botón final permite repetir el viaje desde Origen. No requiere video ni bibliotecas externas.

Un globo de conversación acompaña al vehículo en tres momentos: en Origen pregunta desde dónde salen las mascotas, en el punto medio cuántas viajan y en Destino hacia dónde van. Entre esos puntos se oculta para despejar el recorrido. El texto bajo el mapa explica cada dato según la etapa alcanzada y conserva esa explicación hasta la siguiente etapa. El título permanece visible durante el recorrido.

El recorrido de la camioneta sigue el scroll tanto en la vista local como en la web publicada. La preferencia de reducir movimiento mantiene los cambios de texto sin animación, pero no altera el recorrido.

Prompts finales usados con la herramienta integrada `image_gen`:

```text
Base de la camioneta, editada desde assets/camioneta-perro-cupula.png:
Edit target: the attached transparent side-view silver-gray compact pickup truck. Remove the entire smiling puppy face sticker/decal from the dark charcoal rear canopy and restore that area as a plain, clean dark charcoal canopy side panel/window matching its surrounding material. Preserve every other aspect of the truck: same right-facing side profile, cab, bed canopy shape, silver body, two wheels, lighting, proportions, transparent background and full framing. Exactly one EMPTY pickup truck, with no dog or other animals anywhere, no text, logos, badges, scenery, road, map or watermark. This will be used as the BACK LAYER beneath a separately positioned dog image, so keep the canopy clearly visible and uninterrupted.

Recorte del perro, derivado de assets/camioneta-perro-doble.png:
Create a SEPARATE transparent foreground cutout asset from the smiling golden dog in the reference image. Output ONLY the dog, centered: an expressive golden retriever-type head with both floppy ears, happy bright eyes, wide open smiling mouth, pink tongue, and a little natural chest fur tapering at the bottom. Preserve this dog's friendly face and photorealistic fur. No vehicle, truck, canopy, glass, window, frame, road, scenery, people, text, logo, badge, stickers, shadow plate or background whatsoever. Do not crop any ears or the top of the head. The dog should have a clean natural alpha silhouette with generous transparent margin. This will be placed as an independent LARGE foreground layer over a pickup truck image, intentionally extending beyond the canopy silhouette, so do not constrain it to any vehicle shape.
```

## Imagen conceptual

`public/assets/perro-gato-conceptual.png` fue generada con la herramienta integrada `image_gen` para este prototipo. No representa mascotas de clientes ni prueba del servicio. La imagen se reemplazará si se dispone de fotografías propias con permiso.

Prompt usado:

```text
Use case: photorealistic-natural
Asset type: conceptual hero image for a pet transport website visual mockup
Primary request: A friendly medium-sized mixed-breed dog and a domestic short-haired tabby cat sitting calmly side by side, full bodies visible, natural attentive expressions. They are generic representative pets, not any real client's animals.
Scene/backdrop: clean studio cutout with genuinely transparent background.
Style/medium: premium natural editorial pet photography, realistic fur and anatomy, not cartoonish.
Composition/framing: both animals centered as a cohesive group, dog slightly taller behind and to the left, cat in front to the right, generous clean space around silhouettes, no cropped paws or ears.
Lighting/mood: soft daylight, warm and trustworthy, subtle realistic shadow under paws.
Color palette: neutral fur tones that work against pastel mint #9CE6BD and warm off-white.
Constraints: no vehicle, no cage, no carrier, no people, no collar branding, no text, no logo, no watermark.
```
