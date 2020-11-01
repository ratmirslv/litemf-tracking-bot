FROM node:12.19.0-alpine

WORKDIR /bot

COPY package*.json ./

RUN npm ci --silent

COPY . .

RUN npm run build \
  && npm prune --production \
  && npm cache clean --force

CMD ["npm", "start"]
