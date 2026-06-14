# 📘 PROJECT ROOT: CoupleCash (MVP - Finanzas en Familia)

## 1. Visión del Producto
CoupleCash es una PWA de finanzas diseñada para hogares compartidos. Su propuesta de valor es la sincronización en tiempo real, el cálculo inteligente de presupuestos compartidos y una interfaz de usuario estadística, elegante y predictiva.

## 2. Arquitectura Base & Sistema de Diseño
- **Frontend:** Next.js (App Router), React Server Components, Tailwind CSS, Framer Motion (Transiciones "iOS-like").
- **Backend & Auth:** Supabase (PostgreSQL).
- **Entidad Principal (Household):** El núcleo de la base de datos no es el "Usuario", es el "Hogar" (Household). Los usuarios se invitan a un Hogar. Todas las tablas (transacciones, ahorros, categorías) están atadas al `household_id` mediante Row Level Security (RLS) estricto.

---

## 3. Lógica Financiera y Cálculos Core (Motores de la App)

### Motor de Divisas (AUD / COP)
- **Configuración Global:** El Hogar tiene una divisa base (ej. AUD). 
- **Lógica de Inserción:** Al registrar un gasto en COP mientras la app está en AUD, el sistema utiliza una tasa de conversión (estática por ahora, API en el futuro) para almacenar el valor real original, pero renderizar los gráficos en la divisa preferida.

### Motor de "Saldo Real" y Reconciliación
- **Cálculo de Saldo:** `SUM(Ingresos) - SUM(Gastos) + SUM(Ajustes)`.
- **Ajuste Bancario:** Si la app dice $5,000 pero el banco dice $5,200, el usuario usa la función "Reconciliar". El sistema crea una transacción automática de tipo "Ajuste" por +$200 para que la matemática cuadre perfectamente sin alterar el historial.

### Motor de Ahorros e Interés Compuesto
- **Matemática Simple:** `Tiempo estimado = (Monto Meta - Monto Actual) / Aporte Periódico`.
- **Matemática Inversión (Interés Compuesto):** Si el ahorro genera rentabilidad (ej. en un CDT o cuenta de alto rendimiento), se aplica la fórmula de Valor Futuro en las proyecciones para mostrar visualmente cómo el interés acorta el tiempo para llegar a la meta.

---

## 4. Mapa de Navegación y Pantallas (Bottom Tab Bar)

### 📱 TAB 1: Dashboard (El "Wow" Estadístico)
*La radiografía visual y analítica del mes. Filtros globales: Semanal / Mensual.*
- **Header:** Saldo Real (Ajustable).
- **Widgets de Alto Impacto:**
  - **Dinero Libre de Culpa:** `Ingresos Mensuales - (Gastos Fijos Programados + Metas de Ahorro)`. Muestra exactamente cuánto pueden gastar en ocio sin desbalancear el mes.
  - **Gráfico de Dona / Barras:** Ingresos Totales vs Gastos Totales.
  - **Top Categorías:** Tarjetas visuales mostrando el gasto en Restaurantes, Mercado y Servicios en el periodo actual.
  - **Progreso de Ahorros:** Mini-barras de progreso de las metas activas.

### 📱 TAB 2: Búsqueda y Análisis (`/buscar`)
*El motor de auditoría financiera.*
- **Buscador Universal:** Búsqueda por texto (ej. "Uber", "Cena").
- **Filtros Avanzados:** Por Rango de Fechas, Categoría, Tipo (Ingreso/Gasto) y Autor (Quién hizo el gasto).
- **Lista de Resultados:** Scrolleable, con íconos de categoría.
- **Acción:** Botón flotante "Exportar a CSV" para generar reporte en Excel.

### 📱 TAB 3: Añadir (+) - *El Motor Principal*
*Bottom Sheet animado enfocado en rapidez y flexibilidad.*
- **Sección A: Registro Estándar (Ocasional vs Fijo)**
  - Selectores: Tipo (Ingreso/Gasto), Categoría, Monto.
  - Ocasional: (ej. un pago puntual por inspección de carga, una cena).
  - Fijo/Recurrente: Al marcar la casilla "Recurrente", se despliega la frecuencia (Semanal, Quincenal, Mensual). El sistema clonará este gasto/ingreso automáticamente en el futuro.
  - Rastreo de Autor: El sistema registra automáticamente el `user_id` del creador.
- **Sección B: Modo Detallado (Mercado/Facturas Múltiples)**
  - Si el gasto es "Mercado", se activa un toggle para habilitar "Añadir Ítems".
  - Interfaz cambia a un generador de lista: `[Nombre Producto] - [$Precio]`. El total del gasto se auto-calcula sumando los ítems de la lista. En BD se guarda como JSONB dentro de la transacción.

### 📱 TAB 4: Ahorros e Inversión (`/ahorros`)
*Proyección de riqueza.*
- **Listado de Metas:** Tarjetas con la fecha objetivo, monto acumulado y porcentaje completado.
- **Creador de Metas:** Define monto, categoría, y si el dinero está "Quieto" o "Generando Rentabilidad".
- **Visualizador de Proyección:** Gráfico lineal que muestra la curva de crecimiento del ahorro mes a mes hasta llegar a la fecha objetivo.

### 📱 TAB 5: Predicciones y Radar (`/predicciones`)
*El asistente financiero proactivo.*
- **Radar de Servicios:** Lista de gastos fijos que *ya se sabe* que hay que pagar este mes (Arriendo, Luz, Internet) y cambia de estado (Pendiente -> Pagado) automáticamente si el sistema detecta un gasto en esa categoría.
- **Predicción de Consumo:** El sistema evalúa el ritmo de gasto actual en "Mercado" y predice: *"Al ritmo actual, gastarás $X a final de mes. Estás un 15% por encima de tu promedio"*.

### 📱 TAB 6: Cuenta y Ajustes (`/ajustes`)
*El panel de control.*
- **Gestión de Hogar (Household):** Código de invitación para vincular a la pareja. Lista de miembros activos.
- **Preferencias:** 
  - Selector global de Divisa (AUD / COP).
  - Selector de Tema (Light / Dark Mode).
- **Seguridad:** Cerrar sesión (Supabase Auth).

---

## 5. Flujo de Onboarding (Registro)
1. Usuario A se registra vía Google/Email.
2. App detecta que no tiene `Household`. Le ofrece: "Crear un Hogar" o "Unirme a uno existente".
3. Crea "Hogar Familia Pérez". La app genera un Código Único.
4. Usuario B se registra, elige "Unirme" e ingresa el código. A partir de ese momento, ambos ven y alimentan el mismo Dashboard en tiempo real.