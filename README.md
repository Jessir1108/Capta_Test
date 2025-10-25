# Working Days API

API REST para calcular fechas hábiles en Colombia, considerando días festivos nacionales, horarios laborales y zonas horarias.

## 🚀 Tecnologías

- **TypeScript**: Lenguaje principal con tipado estricto
- **AWS Lambda**: Función serverless
- **API Gateway**: Endpoint REST público
- **AWS CDK**: Infraestructura como código
- **Node.js 20**: Runtime
- **date-fns & date-fns-tz**: Manejo robusto de fechas y zonas horarias
- **axios**: Peticiones HTTP para festivos
- **Jest**: Testing unitario e integración

## 📋 Requisitos Previos

- Node.js 18+ instalado
- AWS CLI configurado con credenciales (`aws configure --profile your-profile`)
- Docker Desktop corriendo (requerido para bundling de CDK)
- Cuenta de AWS activa

## 🔧 Instalación

1. Clonar el repositorio:

```bash
git clone https://github.com/Jessir1108/Capta_Test.git
cd Capta_Test
```

2. Instalar dependencias:

```bash
npm install
```

3. Configurar AWS (si no está configurado):

```bash
aws configure --profile your-profile
# Ingresar:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: us-east-1
# - Default output format: json
```

4. Actualizar scripts en `package.json` con tu perfil AWS:

```json
{
  "scripts": {
    "bootstrap": "cdk bootstrap --profile your-profile",
    "deploy": "cdk deploy --profile your-profile",
    "destroy": "cdk destroy --profile your-profile"
  }
}
```

## 🧪 Testing

Ejecutar todos los tests:

```bash
npm test
```

Ejecutar tests en modo watch:

```bash
npm run test:watch
```

## 🏗️ Deploy

### Primera vez:

1. Bootstrap de CDK (crea recursos base en AWS):

```bash
npm run bootstrap
```

2. Desplegar la infraestructura:

```bash
npm run deploy
```

3. Al finalizar, CDK mostrará la URL del endpoint:

```
✅ WorkingDaysStack

Outputs:
WorkingDaysStack.ApiUrl = https://xxxxx.execute-api.us-east-1.amazonaws.com/prod/working-days
```

### Actualizaciones posteriores:

```bash
npm run deploy
```

### Destruir la infraestructura:

```bash
npm run destroy
```

## 📖 Uso de la API

### 🌐 Endpoint Público

```
https://tw0fhokbpk.execute-api.us-east-1.amazonaws.com/prod/working-days
```

### Parámetros (Query String)

| Parámetro | Tipo    | Requerido | Descripción                                  |
| --------- | ------- | --------- | -------------------------------------------- |
| `days`    | integer | No\*      | Número de días hábiles a sumar (≥ 0)         |
| `hours`   | integer | No\*      | Número de horas hábiles a sumar (≥ 0)        |
| `date`    | string  | No        | Fecha inicial en UTC ISO 8601 con sufijo 'Z' |

\*_Al menos uno de `days` o `hours` debe ser proporcionado._

### Respuestas

#### Éxito (200 OK)

```json
{
  "date": "2025-04-21T20:00:00.000Z"
}
```

#### Error (400 Bad Request)

```json
{
  "error": "InvalidParameters",
  "message": "No query parameters provided"
}
```

#### Error Interno (503 Service Unavailable)

```json
{
  "error": "InternalServerError",
  "message": "Failed to fetch holidays data"
}
```

## 📌 Ejemplos de Uso

### 1. Sumar 1 día hábil desde ahora

```bash
curl "https://tw0fhokbpk.execute-api.us-east-1.amazonaws.com/prod/working-days?days=1"
```

### 2. Sumar 2 horas hábiles desde ahora

```bash
curl "https://tw0fhokbpk.execute-api.us-east-1.amazonaws.com/prod/working-days?hours=2"
```

### 3. Sumar 1 día y 4 horas desde una fecha específica

```bash
curl "https://tw0fhokbpk.execute-api.us-east-1.amazonaws.com/prod/working-days?date=2025-05-13T20:00:00.000Z&days=1&hours=4"
```

**Respuesta:**

```json
{
  "date": "2025-05-15T15:00:00.000Z"
}
```

**Explicación:** Martes 13 Mayo 3PM COL + 1 día → Miércoles 3PM + 4 horas → Jueves 10AM COL (15:00Z UTC)

### 4. Caso con festivos (17 y 18 de Abril)

```bash
curl "https://tw0fhokbpk.execute-api.us-east-1.amazonaws.com/prod/working-days?date=2025-04-10T15:00:00.000Z&days=5&hours=4"
```

**Respuesta:**

```json
{
  "date": "2025-04-21T20:00:00.000Z"
}
```

**Explicación:** Jueves 10 Abril 10AM COL + 5 días hábiles (salta festivos 17-18 + fin de semana) + 4 horas → Lunes 21 Abril 3PM COL (20:00Z UTC)

### 5. Ajuste desde fin de semana

```bash
curl "https://tw0fhokbpk.execute-api.us-east-1.amazonaws.com/prod/working-days?date=2025-05-24T19:00:00.000Z&hours=1"
```

**Respuesta:**

```json
{
  "date": "2025-05-26T14:00:00.000Z"
}
```

**Explicación:** Sábado 2PM COL ajusta hacia atrás a Viernes 5PM + 1 hora → Lunes 9AM COL (14:00Z UTC)

## 📚 Reglas de Negocio

### Horario Laboral

```
Lunes a Viernes:
  08:00 - 12:00  ✅ 4 horas laborales
  12:00 - 13:00  ❌ ALMUERZO (NO cuenta)
  13:00 - 17:00  ✅ 4 horas laborales

Total: 8 horas laborales por día
Fin de semana: NO laborales
```

### Ajuste de Fecha Inicial

Si la fecha está **fuera del horario laboral**, se ajusta **hacia atrás** al momento laboral más cercano:

- Antes de 8:00 AM → Día laboral anterior 5:00 PM
- Durante almuerzo (12:00-1:00 PM) → 12:00 PM mismo día
- Después de 5:00 PM → 5:00 PM mismo día
- Fin de semana → Viernes anterior 5:00 PM
- Festivo → Día laboral anterior 5:00 PM

### Festivos Colombianos

Los festivos se obtienen de: `https://content.capta.co/Recruitment/WorkingDays.json`

Se excluyen automáticamente al calcular días hábiles.

### Conversión de Zona Horaria

- **Cálculos**: Se realizan en hora de Colombia (America/Bogota, UTC-5)
- **Respuesta**: Se retorna en UTC ISO 8601 con sufijo 'Z'

**Ejemplo:**

- Lunes 10:00 AM COL = `2025-XX-XXT15:00:00.000Z` (3:00 PM UTC)

## 🏗️ Arquitectura

```
┌─────────────────────────────────┐
│      API Gateway (REST)         │
│   Endpoint público HTTP          │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│      Lambda Function            │
│   (Node.js 20 + TypeScript)     │
│                                 │
│  ┌───────────────────────────┐ │
│  │  Handler                  │ │
│  │  - Validación params      │ │
│  │  - Orquestación           │ │
│  └────────┬──────────────────┘ │
│           │                     │
│  ┌────────▼──────────────────┐ │
│  │  Date Calculator          │ │
│  │  - Ajuste horario         │ │
│  │  - Suma días/horas        │ │
│  └────────┬──────────────────┘ │
│           │                     │
│  ┌────────▼──────────────────┐ │
│  │  Holiday Utility          │ │
│  │  - Fetch festivos (HTTP)  │ │
│  │  - Cache en memoria       │ │
│  └───────────────────────────┘ │
└─────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│   External API (Holidays JSON)  │
└─────────────────────────────────┘
```

## 📁 Estructura del Proyecto

```
working-days-api/
├── bin/
│   └── app.ts                    # Entry point CDK
├── lib/
│   └── working-days-stack.ts     # Definición infraestructura CDK
├── lambda/
│   ├── handlers/
│   │   └── workingDay.ts         # Lambda handler
│   ├── services/
│   │   └── dateCalculator.ts     # Lógica de cálculo
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   └── utils/
│       └── holiday.ts            # Manejo de festivos
├── tests/
│   ├── unit/
│   │   └── dateCalculator.test.ts
│   └── integration/
│       └── workingDays.api.test.ts
├── cdk.json                      # Config CDK
├── tsconfig.json                 # Config TypeScript
├── jest.config.js                # Config Jest
├── package.json
└── README.md
```

## 🔑 Decisiones Técnicas

### ¿Por qué AWS Lambda + CDK?

- **Serverless**: Sin gestión de servidores
- **Auto-scaling**: Maneja carga automáticamente
- **Pay-per-use**: Solo pagas por ejecuciones
- **CDK (IaC)**: Infraestructura versionada y reproducible
- **Bonus**: Cumple requisito extra de la prueba técnica

### ¿Por qué date-fns-tz?

- **Inmutabilidad**: Las funciones no mutan objetos Date
- **Tree-shakeable**: Solo importas lo que usas
- **TypeScript nativo**: Tipado completo
- **Zone-aware**: `toZonedTime` y `fromZonedTime` manejan zonas horarias correctamente
- **Sin ambigüedades**: Evita problemas de Date nativo

### ¿Por qué Set<string> para festivos?

- **Búsqueda O(1)** vs Array O(n)
- Con 20+ festivos por año, el Set es mucho más eficiente
- Cache en memoria entre invocaciones Lambda

### ¿Por qué ajustar hacia atrás?

El documento especifica: _"Si la fecha ingresada está por fuera del horario de trabajo debe aproximarse hacia atrás"_

**Razón de negocio**: No se puede "inventar" tiempo laboral que no ha ocurrido.

## 🔍 Monitoreo y Logs

Los logs de Lambda están disponibles en CloudWatch:

```bash
# Ver logs en tiempo real
aws logs tail /aws/lambda/WorkingDaysStack-WorkingDaysFunction... --follow --profile your-profile
```

O visita la [Consola de CloudWatch](https://console.aws.amazon.com/cloudwatch/)

## 💰 Costos Estimados

Con 10,000 requests/mes:

```
Lambda:        $0.20  (10,000 × 256MB × 200ms)
API Gateway:   $0.04  (10,000 requests)
CloudWatch:    $0.50  (logs)
───────────────────────────────────
Total:         ~$0.75 USD/mes
```

**Lambda Free Tier** incluye:

- 1M requests/mes
- 400,000 GB-segundos de compute

_Esta API cabe en el free tier._

## 🐛 Troubleshooting

### Error: Docker not running

```bash
# Verificar Docker
docker ps

# Si falla, abrir Docker Desktop
```

### Error: AWS credentials not configured

```bash
aws configure --profile your-profile
aws sts get-caller-identity --profile your-profile
```

### Tests fallan

```bash
# Limpiar y reinstalar
rm -rf node_modules
npm install
npm test
```

## 👤 Autor

Jessir Daniel Florez Hamburger

## 🔗 Links

- **API en producción**: https://tw0fhokbpk.execute-api.us-east-1.amazonaws.com/prod/working-days
- **Repositorio**: https://github.com/Jessir1108/Capta_Test.git
- **Documentación AWS CDK**: https://docs.aws.amazon.com/cdk/
- **date-fns-tz**: https://github.com/marnusw/date-fns-tz
