/*
 * Copyright 2024 bakduo Licensed under MIT
 * See license text at https://mit-license.org/license.txt
 */
var nextID = Date.now().toString();
const WebSocketServer = require("ws").Server;
const { CollectionWS } = require("./model/client");
const { ServiceWS, collaborates } = require("./model/managerWS");
const { logger, port } = require("./config/config");

const clients = new CollectionWS();
const wss = new WebSocketServer({ port: port });
const services = new ServiceWS();

services.setUsers(clients);
services.setWS(wss);
services.setNextID(nextID);

services.getWS().on("listening", function () {
  logger.info(`Server started with port: ${port}`);
});

services.getWS().on("connection", function (connection) {
  // Accept the request and get a connection.
  if (connection.remoteAddress) {
    logger.debug(`Connection accepted from: ${connection.remoteAddress}`);
  }

  connection.on("close", function close() {
    logger.debug("Disconnecting user");
    services.checkConnection();
  });

  connection.on("message", function (message) {
    logger.debug("User connected");

    logger.debug(`message from user: ${message}`);

    let data = null;

    try {
      data = JSON.parse(message);

      console.log(`Payload del mensaje: ${JSON.stringify(data)}`);

      services.setForward(true);

      try {
        if (services.handler().getSupport(data.type)) {
          services.handler()
            .getOperation(data.type)
            .do(collaborates(connection, data, services));
        } else {
          logger.debug(`Operation don't support: ${data.type}`);
        }
      } catch (e) {
        logger.debug(`ServiceWS handler getOperation debug: ${e.mesage}`);
      }

      logger.debug(`Operation continue by check forward: ${data.type}`);

      if (services.getForward()) {
        if (data.target) {
          services.sendPayloadByForward(data.target, data);
        }
      }
    } catch (error) {
      logger.debug(`Payload error : ${error.message}`);
      connection.send(
        JSON.stringify({ status: false, message: error.message }),
      );
    }
  });
});
