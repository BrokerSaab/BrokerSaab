FROM node:20-alpine

WORKDIR /usr/src/app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

RUN npm install --legacy-peer-deps

RUN npx prisma generate

COPY src ./src

RUN npm run build

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/app.js"]
