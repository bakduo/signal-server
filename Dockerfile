FROM node:16.18.1

LABEL maintainer="bakduo"

# Set to a non-root built-in user `node`
USER node

# Create app directory (with user `node`)
RUN mkdir -p /home/node/app && mkdir /home/node/app/config /home/node/app/log /home/node/app/uploads

WORKDIR /home/node/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY --chown=node package*.json ./

RUN NODE_ENV=production npm shrinkwrap && npm ci && npm install

# Bundle app source code
COPY --chown=node . .

# Bind to all network interfaces so that it can be mapped to the host OS

ENV HOST=0.0.0.0 PORT=8080 APP_ID=changeme

VOLUME [ "config/","log/"]

EXPOSE ${PORT}

CMD [ "npm", "run", "start:pm2docker" ]