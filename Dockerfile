FROM node:14.16-alpine AS builder

WORKDIR /usr/src/app

RUN apk add python make gcc g++

#npm install -g npm@7.7.5

COPY . .

RUN npm install

RUN npm run build

FROM node:15.12-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/ .

RUN mv .secrets/* ../

CMD ["node", "dist/main"]
