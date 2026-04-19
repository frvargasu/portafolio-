# Decisiones Técnicas

Este documento explica las decisiones de arquitectura y tecnología tomadas durante el desarrollo del sistema.

---

## Backend

### ¿Por qué Node.js + Express?

**Decisión:** Usar Node.js con Express como framework HTTP.

**Razones:**
- **JavaScript fullstack:** Mismo lenguaje en frontend y backend reduce fricción cognitiva
- **Ecosistema npm:** Acceso a miles de paquetes bien mantenidos
- **Performance:** Event loop eficiente para operaciones I/O (ideal para APIs REST)
- **Popularidad:** Amplia comunidad y documentación

**Alternativas consideradas:**
- NestJS: Más estructura pero mayor curva de aprendizaje para un MVP
- Fastify: Más rápido pero menos ecosistema de middleware

---

### ¿Por qué MySQL?

**Decisión:** Usar MySQL 8.0 como base de datos relacional.

**Razones:**
- **Modelo relacional:** Las ventas y el inventario tienen relaciones claras (productos ↔ ventas ↔ usuarios)
- **ACID:** Transacciones garantizadas para operaciones críticas (ventas, stock)
- **Madurez:** Décadas de uso en producción, bugs conocidos y resueltos
- **Triggers:** Validaciones a nivel de base de datos como segunda capa de seguridad
- **Indexación:** B-tree indexes eficientes para búsquedas por código de barras

**Alternativas consideradas:**
- PostgreSQL: Igual de válida, MySQL elegido por familiaridad
- MongoDB: No ideal para datos transaccionales con relaciones fuertes

---

### ¿Por qué JWT para autenticación?

**Decisión:** Implementar autenticación con JSON Web Tokens.

**Razones:**
- **Stateless:** No requiere sesiones en servidor, escala horizontalmente
- **Self-contained:** El token incluye claims del usuario (id, rol)
- **Estándar:** RFC 7519, ampliamente adoptado

**Implementación:**
```javascript
// Token payload
{
  id: 1,
  email: "user@example.com",
  rol: "vendedor",
  iat: 1642234567,
  exp: 1642320967  // 24 horas
}
```

**Seguridad adicional:**
- Tokens expiran en 24 horas
- Passwords hasheados con bcrypt (10 rounds)
- Rate limiting en endpoints de auth

---

### ¿Por qué arquitectura en capas?

**Decisión:** Separar en Routes → Controllers → Services → Repositories.

**Razones:**
- **Single Responsibility:** Cada capa tiene una función específica
- **Testabilidad:** Puedo mockear repositories para testear services
- **Mantenibilidad:** Cambiar la base de datos solo afecta a repositories
- **Reusabilidad:** Services pueden ser usados por múltiples controllers

**Ejemplo de flujo:**
```
POST /api/ventas
    ↓
ventaRoutes.js      → Define ruta, aplica middleware
    ↓
ventaController.js  → Extrae datos del request, llama service
    ↓
ventaService.js     → Valida reglas de negocio, orquesta operaciones
    ↓
ventaRepository.js  → Ejecuta queries SQL en transacción
```

---

### ¿Por qué transacciones con FOR UPDATE?

**Decisión:** Usar `SELECT ... FOR UPDATE` para bloqueo pesimista en ventas.

**Problema:** Dos ventas simultáneas del mismo producto pueden causar stock negativo.

**Solución:**
```javascript
// ventaRepository.js
await db.transaction(async (conn) => {
  // Bloquea la fila del producto hasta que termine la transacción
  const producto = await conn.query(
    'SELECT stock FROM productos WHERE id = ? FOR UPDATE',
    [productoId]
  );
  
  if (producto.stock < cantidad) {
    throw new Error('Stock insuficiente');
  }
  
  await conn.query('UPDATE productos SET stock = stock - ?', [cantidad]);
  await conn.query('INSERT INTO detalle_ventas ...', [...]);
});
```

**Alternativas consideradas:**
- Optimistic locking (version column): Más complejo de implementar
- Queue de ventas: Overkill para el volumen esperado

---

### ¿Por qué Rate Limiting?

**Decisión:** Implementar límites de peticiones en endpoints sensibles.

**Configuración:**
| Endpoint | Límite | Ventana |
|----------|--------|---------|
| General `/api/*` | 100 requests | 15 min |
| `POST /login` | 5 intentos | 15 min |
| `POST /register` | 3 registros | 1 hora |

**Razones:**
- Prevenir brute force en login
- Evitar spam de registros
- Proteger recursos del servidor

**Implementación:** `express-rate-limit` con almacenamiento en memoria (adecuado para single-instance).

---

## Frontend

### ¿Por qué Angular?

**Decisión:** Usar Angular 20 con standalone components.

**Razones:**
- **TypeScript nativo:** Tipado estático reduce bugs
- **Angular Material:** Componentes UI consistentes y accesibles
- **CLI potente:** Scaffolding, builds optimizados, testing incluido
- **Estructura opinada:** Buena para proyectos que crecerán

**Alternativas consideradas:**
- React: Más flexible pero requiere más decisiones de arquitectura
- Vue: Curva de aprendizaje más suave pero menos estructura

---

### ¿Por qué Standalone Components?

**Decisión:** Usar componentes standalone en lugar de NgModules tradicionales.

**Razones:**
- **API moderna:** Patrón recomendado desde Angular 14+
- **Tree-shaking mejorado:** Solo se importa lo que se usa
- **Menos boilerplate:** No más `NgModule` para cada feature
- **Lazy loading simplificado:** `loadComponent()` directo en rutas

**Ejemplo:**
```typescript
// Antes (NgModule)
@NgModule({
  declarations: [DashboardComponent],
  imports: [CommonModule, MatCardModule],
  exports: [DashboardComponent]
})
export class DashboardModule {}

// Ahora (Standalone)
@Component({
  standalone: true,
  imports: [CommonModule, MatCardModule],
  template: `...`
})
export class DashboardComponent {}
```

---

### ¿Por qué Lazy Loading?

**Decisión:** Cargar módulos bajo demanda.

**Configuración:**
```typescript
{
  path: 'productos',
  loadChildren: () => import('./modules/productos/productos.routes')
}
```

**Beneficios:**
- **Bundle inicial pequeño:** ~200KB en lugar de ~1MB
- **Tiempo de carga inicial rápido:** Crítico para POS
- **Carga progresiva:** Módulos se cargan cuando se navega

---

### ¿Por qué Interceptors para Auth?

**Decisión:** Usar HTTP Interceptors para agregar token JWT.

**Razones:**
- **DRY:** No repetir `headers.set('Authorization', ...)` en cada request
- **Centralizado:** Un solo punto para manejar autenticación
- **Manejo de errores:** Interceptor de errores redirige a login en 401

**Implementación:**
```typescript
// auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next(req);
};
```

---

## DevOps

### ¿Por qué Docker?

**Decisión:** Containerizar con Docker y docker-compose.

**Razones:**
- **Reproducibilidad:** "Works on my machine" eliminado
- **Onboarding rápido:** `docker-compose up` y listo
- **Paridad dev/prod:** Mismas versiones de Node, MySQL
- **Aislamiento:** Cada servicio en su contenedor

**Estructura:**
```yaml
services:
  db:       # MySQL 8.0
  backend:  # Node.js 20
  frontend: # Nginx + Angular build
```

---

### ¿Por qué GitHub Actions?

**Decisión:** CI/CD con GitHub Actions.

**Pipeline:**
1. **backend-test:** Ejecuta Jest tests
2. **frontend-build:** Compila Angular
3. **docker-build:** Verifica que las imágenes construyan
4. **security-scan:** Trivy para vulnerabilidades

**Razones:**
- **Integrado:** Viene con GitHub, no requiere terceros
- **Gratis:** Para repos públicos
- **YAML declarativo:** Fácil de leer y modificar

---

## Seguridad

### Medidas implementadas

| Área | Medida | Implementación |
|------|--------|----------------|
| Passwords | Hashing | bcrypt, 10 rounds |
| Auth | Tokens | JWT con expiración 24h |
| Headers | Security headers | Helmet.js |
| SQL | Inyección | Queries parametrizadas |
| XSS | Input sanitization | express-validator |
| Brute force | Rate limiting | express-rate-limit |
| CORS | Cross-origin | Configuración whitelist |

---

### ¿Por qué Soft Delete?

**Decisión:** Marcar registros como `activo = false` en lugar de DELETE.

**Razones:**
- **Historial:** Ventas mantienen referencia a productos "eliminados"
- **Auditoría:** Saber qué existió en el pasado
- **Recuperación:** Posibilidad de "restaurar" registros
- **Integridad:** Evitar foreign key violations

---

## Trade-offs y Limitaciones

### Lo que NO se implementó (y por qué)

| Feature | Razón |
|---------|-------|
| WebSockets | No requerido para flujo actual, HTTP polling suficiente |
| Redis | Single instance, almacenamiento en memoria es suficiente |
| Microservicios | Monolito es apropiado para el tamaño del proyecto |
| GraphQL | REST es más simple y cubre los casos de uso |
| SSR | SPA es suficiente, no se requiere SEO |

---

## Ver También

- [Arquitectura](./arquitectura.md) - Estructura del sistema
- [Base de Datos](./database.md) - Modelo de datos
- [API Reference](./api.md) - Documentación de endpoints
