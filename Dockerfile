FROM node:12-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci && npm build && npm prune --production

# Bundle app source
COPY . .

ENV NODE_ENV production
EXPOSE 4000
CMD [ "node", "." ]
