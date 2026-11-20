# PetWay · traslado de mascotas

Espacio de trabajo para planificar y desarrollar PetWay, un emprendimiento de traslado de mascotas con una Fiat Strada. La disponibilidad registral y digital del nombre todavía debe comprobarse.

La documentación vive en [docs/README.md](docs/README.md). Para continuar la conversación, conviene empezar por [las preguntas prioritarias](docs/00-coordinacion/preguntas-prioritarias.md).

La [primera maqueta visual de la web](apps/web/README.md) permite revisar la portada en escritorio y móvil. Es un prototipo local con contenido provisional.

Para abrirla: entrar en `apps/web/`, ejecutar `npm install` una vez, completar `.env` a partir de `.env.example`, iniciar con `npm run dev` y visitar `http://127.0.0.1:5173` (Node.js 18 o posterior).

## Estado inicial

- **Confirmado:** la base será Montevideo, con viajes dentro de la ciudad y al interior de Uruguay; se dispone de una Fiat Strada con cúpula en la caja y asientos traseros.
- **Transporte comunicado:** hasta 2 perros en caniles separados dentro de la cúpula y 2 gatos en transportines sujetos con cinturón de seguridad en el asiento trasero. El emprendedor confirma que el equipamiento está instalado y probado; faltan medidas y protocolos por documentar.
- **Por definir:** límites de cobertura, servicios concretos, capacidad y condiciones de transporte, disponibilidad del nombre, precios, confirmación de reservas y forma de cobro. La primera web se dirigirá a tutores particulares, destacará Montevideo y abrirá WhatsApp para consultar un viaje.
- **Criterio de trabajo:** los documentos distinguen hechos confirmados, propuestas y decisiones pendientes.

La aplicación completa vive en `apps/web/`: sitio público, servidor local, configuración, datos y pruebas. Las reglas del negocio y los criterios de diseño siguen documentados en `docs/`.
