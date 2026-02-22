# Cambios realizados (Mapa añadido)

- ¡Sí! Ahora el detalle de los *Merchants* (`MerchantsPage.tsx`) tiene un módulo de Mapas usando `react-leaflet`.
- Instalamos los paquetes necesarios (`leaflet`, `react-leaflet`) para renderizar un mapa con OpenStreetMap allí mismo.
- Además de ver la información cruda del JSON, si la tienda (o tiendas) de ese merchant tiene una dirección o coordenadas registradas *(en `address.lat` y `address.long`)*, estas se plottearán dinámicamente sobre la capa del mapa con hermosos *Markers* dándote su detalle visual directo en pantalla, ¡todo sin tener que salirte del dashboard!

¡Revisa cualquier Merchant! Notarás la diferencia espectacular del visualizador cartográfico.
