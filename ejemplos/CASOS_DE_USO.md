# 🎓 Casos de Uso de prueba para simulación de Smart Campus

Este repositorio contiene un set de ejemplos diseñados para validar el funcionamiento de la herramienta ***Genesis 2.0*** con ejemplos de uso en un entorno universitario. Los ejemplos están organizados en tres carpetas: `sensores/`, `patrones/` y `simulaciones/`.

Todos los casos han sido optimizados para representar **ciclos completos de 24 horas**, con parámetros adecuados para dar coherencia visual en las gráficas.

---

## 🏛️ Caso 1: Calidad del Aire y Bienestar (Biblioteca)

**Objetivo:** Monitorizar la acumulación de $CO_2$ para optimizar la ventilación y garantizar un aire saludable en zonas de alta densidad de estudiantes.

### 📄 Archivos asociados
* **Sensores:** `sensores_calidad_aire_biblioteca.json` (5 nodos en Salas de Estudio, Estanterías y Salas de Trabajo).
* **Patrones:** `patrones_calidad_aire_biblioteca.json` (Ciclo Nocturno, Jornada Diaria, Ventilación).
* **Simulación:** `simulacion_calidad_aire_biblioteca.json`.

### 🔍 Descripción del flujo
Simula el ciclo de vida del aire en el edificio. Los mensajes incluyen parámetros técnicos completos: `deveui`, `joineui`, `long`, `lat`, `cote` y `voc_index`.

> **📌 Secuencia Recomendada (Ciclo 24h):**
> 1. **`pat_co2_madrugada`**: Establece el estado base de aire limpio (8h).
> 2. **`pat_co2_jornada`**: Simula el incremento progresivo por la llegada de estudiantes (12h).
> 3. **`pat_co2_ventilacion`**: Muestra el descenso tras el cierre por la activación de sistemas mecánicos (4h).

---

## 🌿 Caso 2: Gestión Hídrica Inteligente (Jardines)

**Objetivo:** Optimizar el riego automático basándose en la humedad real del suelo, evitando el desperdicio de agua y detectando fenómenos climáticos.

### 📄 Archivos asociados
* **Sensores:** `sensores_humedad_jardines_campus.json` (4 nodos en Césped, Huerto, Sombras y Taludes).
* **Patrones:** `patrones_humedad_jardines_campus.json` (Tormenta de Verano, Ola de Calor, Riego por Goteo).
* **Simulación:** `simulacion_humedad_jardines_campus.json`.

### 🔍 Descripción del flujo
Configuración orientada al análisis de tendencias a largo plazo. Registra `humedad_suelo` y `caudal_lpm` junto con la geolocalización exacta de cada sensor.

> **📌 Secuencia Recomendada (Ciclo 24h):**
> 1. **`pat_h2o_evaporacion`**: Simula la pérdida de humedad por incidencia solar (14h).
> 2. **`pat_h2o_riego`**: Muestra la recuperación rápida del terreno mediante riego programado (2h).
> 3. **`pat_h2o_reposo`**: Estabilidad de la humedad durante la noche (8h).

---

## 🖥️ Caso 3: Seguridad Térmica en CPD (Servidores)

**Objetivo:** Prevención de fallos críticos de hardware y monitorización de la eficiencia del sistema de refrigeración en el centro de datos.

### 📄 Archivos asociados
* **Sensores:** `sensores_incidencia_servidores.json` (4 nodos en Racks de GPU, Core y Pasillos de Aire).
* **Patrones:** `patrones_incidencia_servidores.json` (Proceso Batch, Anomalía Térmica Extrema, Reposo).
* **Simulación:** `simulacion_incidencia_servidores.json`.

### 🔍 Descripción del flujo
Simulación de alta resolución para detectar anomalías térmicas rápidas. Los parámetros incluyen `temp_rack`, `potencia_kw`, `fan_speed_rpm` y metadatos de posición.

> **📌 Secuencia Recomendada (Ciclo 24h):**
> 1. **`pat_srv_base`**: Normalidad operativa con baja carga de trabajo (10h).
> 2. **`pat_srv_actividad`**: Incremento térmico por procesamiento intensivo de datos (10h).
> 3. **`pat_srv_enfriamiento`**: Retorno a la línea base tras la finalización de tareas pesadas (4h).

---

## 🛠️ Cómo utilizar estos ejemplos

1. **Importar Sensores:** Carga el archivo de la carpeta `sensores/`.
2. **Importar Patrones:** Carga el archivo de la carpeta `patrones/` para poder asignar cada patrón de comportamiento que quieras en la configuración de la simulación.
3. **Importar Simulación:** Selecciona la simulación correspondiente en `simulaciones/`. Verás que las secciones para asignar patrones estarán vacías.
4. **Validar:** Comprueba en un gráfico de salida que los datos generados mantienen la coherencia técnica y la narrativa del caso de uso.
