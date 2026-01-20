FROM node:18-alpine

WORKDIR /app

# Copia apenas o server primeiro (cache eficiente)
COPY server/package*.json ./server/

# Instala dependências do backend
RUN cd server && npm install --production

# Copia o resto do projeto
COPY . .

EXPOSE 3000

CMD ["node", "server/api.js"]