
/*
* Copyright 2024 bakduo Licensed under MIT
* See license text at https://mit-license.org/license.txt
*/
var nextID = Date.now().toString();
const WebSocketServer = require('ws').Server;
const { UsersRTC } = require ("./model/usuarios");
const { ManagerWS,collaborates } = require ("./model/managerWS");
const { logger, port }= require('./config/config');

const usuariosRTC=new UsersRTC();
const wss = new WebSocketServer({ port: port });
const managerWS = new ManagerWS();

managerWS.setUsers(usuariosRTC);
managerWS.setWS(wss);
managerWS.setNextID(nextID);

managerWS.getWS().on('listening', function (){
  logger.info(`Server started with port: ${port}`)
});

managerWS.getWS().on('connection', function (connection){
    
    // Accept the request and get a connection.
    if (connection.remoteAddress){
      logger.debug(`Connection accepted from: ${connection.remoteAddress}`);
    }

    connection.on('close', function close() {
      logger.debug("Disconnecting user");
      managerWS.checkConnection();
    });
    
    connection.on('message', function (message) {
      
      logger.debug("User connected");
      
      logger.debug(`message from user: ${message}`);

      let data = null;
      
      try {
        data = JSON.parse(message);

        console.log(`Payload del mensaje: ${JSON.stringify(data)}`);

        managerWS.setForward(true);
  
        try {
          if (managerWS.handler().getSupport(data.type)){
            managerWS.handler().getOperation(data.type).do(collaborates(connection,data,managerWS));
          }else{
            logger.debug(`Operation don't support: ${data.type}`);
          }
        } catch(e) {
          logger.debug(`managerWS handler getOperation debug: ${e.mesage}`);
        }
  
        logger.debug(`Operation continue by check forward: ${data.type}`);
        
        if (managerWS.getForward()){

          if (data.target){
            managerWS.sendPayloadByForward(data.target,data);
          }
          
        }
      } catch (error) {
        logger.debug(`Payload error : ${error.message}`);
        connection.send(JSON.stringify({status:false, message:error.message}));
      }

    });
});