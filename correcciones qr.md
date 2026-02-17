# Correcciones QR - Partilot App

## Problemas identificados

### Como vendedor

1. **Venta QR (desde opción VENTA)**  
   Al hacer la lectura de QR por rango o individual para la venta de participaciones, no permite agregar método de pago como en la venta manual (individual o por rango). No muestra correctamente a qué set pertenece la participación ni valida si pertenece a un set asignado al vendedor. Falta el modal con monto de venta y métodos de pago (transferencia, bizum, efectivo u omitir).

2. **Escáner del menú inferior**  
   La opción Escáner debería abrir la venta individual por QR: detectar el set, validar que la participación pertenece a un set asignado al vendedor y permitir método de pago. Actualmente usa un flujo distinto (digitalización múltiple).

3. **Método de pago se propaga a ventas anteriores**  
   Si se vende 1–10 con transferencia y luego la 11 con Bizum, todas quedan marcadas con Bizum.

### Como cliente

4. **Escáner no digitaliza correctamente**  
   Desde Cartera la digitalización funciona bien. El Escáner del menú debería hacer lo mismo: leer QR, mostrar detalle, opción de digitalizar y redirigir a Cartera. Actualmente guarda solo en localStorage y no vincula en la API.

---

## Propuestas de solución

### Tarea 1: Venta QR – modal de método de pago, mostrar set y validar asignación (VENDEDOR)

**Archivos:** `src/app/venta-qr/venta-qr.page.ts`, `venta-qr.page.html`

**Problema:** No muestra modal de resumen con método de pago, no muestra el set y no valida la asignación.

**Solución:**
- **Modo unidad:** Antes de vender, consultar la participación con `checkByReference` para obtener set, sorteo y validar asignación. Mostrar `infoSet` en la UI. Mostrar modal de resumen con método de pago antes de llamar a `sellByQr`.
- **Modo rango:** Tras escanear “hasta”, mostrar modal de resumen con método de pago antes de llamar a `venderRango()`. La info del set ya se obtiene en el flujo actual.
- En ambos modos: nunca vender sin pasar antes por el modal de resumen donde el usuario elige el método de pago.

---

### Tarea 2: Escáner vendedor – igual que venta individual por QR (VENDEDOR)

**Archivo:** `src/app/escaner/escaner.page.ts`

**Problema:** El Escáner vendedor usa digitalización múltiple en vez del flujo de venta individual.

**Solución:**
- Cuando `isVendedor === true`, el flujo debe ser: escanear QR → consultar participación → validar set asignado → mostrar detalle y set → mostrar modal con método de pago → vender participación individual.
- Opciones:
  - **A)** Navegar a `venta-qr` en modo unidad pasando la referencia (query/state).
  - **B)** Implementar el mismo flujo dentro de `EscanerPage` reutilizando la lógica de venta individual.
  Usar opción B.

---

### Tarea 3: Método de pago por venta – evitar propagación (VENDEDOR) ✅

**Archivos:** `src/app/escaner/escaner.page.ts`, `src/app/venta-qr/venta-qr.page.ts`, `src/app/historial/historial.page.ts` y, si aplica, backend

**Problema:** `formaPago` se comparte entre ventas; al guardar o mostrar el historial se usa el valor actual para todas.

**Solución aplicada:**
- `venta-qr`: ya pasaba `formaPagoUsada` a `guardarVentaDigitalEnHistorial` y `guardarVentaRangoEnHistorial`.
- `escaner`: `guardarVentaDigitalEnHistorial` ahora recibe y usa `formaPagoUsada` explícita.
- `historial`: `normalizarFormaPagoEnHistorial()` unifica `formaPago` y `payment_method` al cargar.

**Nota backend:** Si la API sigue mostrando el método equivocado, revisar `ParticipationController::apiGetMySales`: actualmente obtiene `formaPago` de `settlement->payments->first()`, que puede no coincidir con cada venta. Habría que guardar `payment_method` por participación/venta.

---

### Tarea 4: Escáner cliente – usar API para digitalizar (CLIENTE)

**Archivo:** `src/app/escaner/escaner.page.ts`

**Problema:** `digitalizar()` guarda en localStorage y no llama a `carteraService.linkToWallet()`.

**Solución:**
- Cambiar `digitalizar()` para usar `carteraService.linkToWallet(referencia)`.
- Flujo: `checkByReference` → mostrar detalle → `linkToWallet` → `notifyParticipacionesChanged()` → navegar a Cartera (`/tabs/tab1`).
- Eliminar la lógica de localStorage para participaciones en este flujo.

---

## Orden de implementación

1. **Tarea 1** – Venta QR: modal, set y validación (vendedor).
2. **Tarea 2** – Escáner vendedor = venta individual.
3. **Tarea 3** – Método de pago por venta (evitar propagación).
4. **Tarea 4** – Escáner cliente: usar API para digitalizar.

---

## Estado de tareas

- [x] Tarea 1: Venta QR – modal, set y validación (vendedor)
- [x] Tarea 2: Escáner vendedor – igual que venta individual
- [x] Tarea 3: Método de pago por venta (evitar propagación)
- [ ] Tarea 4: Escáner cliente – usar API para digitalizar
