# Límite departamental de Montevideo

`montevideo.geojson` es la geometría del departamento de Montevideo publicada por el Instituto Geográfico Militar en la [capa «Límites departamentales (IGM)» del MVOT](https://sit.mvot.gub.uy/arcgis/rest/services/07_EXTERNO/LIMITES_ADMINISTRATIVOS/MapServer/layers). Se descargó el 2026-11-17 mediante la consulta de la capa 3 con `DEPTO = 'MONTEVIDEO'`, formato GeoJSON y coordenadas WGS84 (`outSR=4326`). La fuente se distribuye bajo la Licencia de Datos Abiertos de Uruguay según el [catálogo IDE](https://test.catalogodatos.gub.uy/dataset/ide-limites-departamentales).

El servidor usa este polígono para clasificar direcciones y repartir la longitud de las rutas a ambos lados del límite. No se envía al navegador.
