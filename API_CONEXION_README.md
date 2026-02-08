# Conexión API - App PARTILOT Vendedor

## Configuración necesaria

### 1. URL de la API
Edita `src/environments/environment.ts` y ajusta la URL de tu API:
```typescript
apiUrl: 'http://localhost/partilot/public/api'  // Desarrollo
```
Para producción, edita `src/environments/environment.prod.ts`.

### 2. Instalar dependencias
```bash
npm install
npx cap sync
```
El plugin `@capacitor/barcode-scanner` ya está en `package.json`. Si usas dispositivo real para QR, ejecuta `npx cap sync` después de instalar.

### 3. Permisos de cámara (Android/iOS)
- **Android**: Añade en `AndroidManifest.xml` si no existe:
  ```xml
  <uses-permission android:name="android.permission.CAMERA" />
  ```
- **iOS**: Añade en `Info.plist`:
  ```xml
  <key>NSCameraUsageDescription</key>
  <string>Necesitamos la cámara para escanear códigos QR de participaciones</string>
  ```

## Flujo de uso

1. **Login**: El vendedor accede a `/vendedor` o `/login` y inicia sesión con email/contraseña.
2. **Restricciones**: Solo vendedores con usuario vinculado, activos y no bloqueados.
3. **Venta manual**: Selecciona reserva/set, introduce rango desde-hasta (o participación unidad) y registra.
4. **Venta QR**: Escanea el código QR de la participación física para marcarla como vendida al instante.

## Endpoints utilizados

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/auth/login` | POST | Login (solo vendedores) |
| `/api/sellers/me/reserves` | GET | Reservas y sets del vendedor |
| `/api/sellers/me/validate-sale` | POST | Validar rango antes de vender |
| `/api/sales/manual` | POST | Marcar participaciones como vendidas (rango) |
| `/api/sales/qr` | POST | Marcar participación como vendida por QR |
