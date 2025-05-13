FROM --platform=linux/amd64 node:18-alpine

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install

COPY . ./

ENV PORT 3000

CMD ["yarn", "dev"]