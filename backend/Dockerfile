# ============================================================
# Cuponera CAMSA — Backend Express
# Multi-stage build para imagen de producción liviana
# ============================================================

# --- Etapa 1: dependencias ---
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

# --- Etapa 2: imagen final ---
FROM node:20-alpine AS runner
WORKDIR /app

# Usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 appuser

# Copiar solo lo necesario
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY package.json ./

# Sin contraseña de root, sin acceso innecesario
USER appuser

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "src/index.js"]
