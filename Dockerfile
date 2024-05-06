ARG NODE_VERSION=21.7.1

FROM node:${NODE_VERSION}-alpine

RUN addgroup app && adduser -S -G app app

USER app

WORKDIR /app

COPY package*.json ./

USER root

RUN chown -R app:app .

WORKDIR /app

RUN npm install

COPY . .

EXPOSE 3000

CMD npm start
