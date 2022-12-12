
/*
* Copyright 2022 bakduo Licensed under MIT
* Copyright 2019 bakduo Licensed under MIT
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
	//console.log("Server started with port "+port);
  logger.info(`Server started with port: ${port}`)
});

managerWS.getWS().on('connection', function (connection){
    
    // Accept the request and get a connection.
    if (connection.remoteAddress){
      logger.debug(`Connection accepted from: ${connection.remoteAddress}`);
    }
    
    connection.on('message', function (message) {
      
      logger.debug("User connected");
      
      logger.debug(`message from user: ${message}`);
      
      let data = JSON.parse(message);

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
      
      //si no es login entonces sera que nos llegan mensajes de los peers para interactuar.
      //se garantiza que cada peer puede interactuar con el servidor hasta que esten en "pares".
      //if (forwarding){  
      if (managerWS.getForward()){
         //if (data.target && data.target !== undefined && data.target.length !== 0){

          if (data.target){

              logger.debug(`usuario: ${data.target}: mode: ${usuariosRTC.getUserByUsername(data.target).getMode()}`);
              
              if (usuariosRTC.getUserByUsername(data.target).getMode()!=="manager"){
                console.log(`Data type: ${data.type}`);
               //Debug INFO FORWARD
               switch (data.type){
                 case "candidate":
                   // statements_1
                   logger.debug(`Candidate este mensaje lo envia : ${data.who} para: ${data.target}\n`);
                   break;
                 case "offer":
                  logger.debug(`Offer este mensaje lo envia : ${data.who} para: ${data.target}\n`);
                   break;
                 case "answer":
                  logger.debug(`Answer este mensaje lo envia : ${data.who} para: ${data.target}\n`);
                   break;
               }
               usuariosRTC.getUserByUsername(data.target).getSocket().send(JSON.stringify(data));
            }else{
              logger.debug("No se envian datos de ofertas de conexion a usuarios manager.");
            }
         }else{
          logger.debug("No es forward para un usuario.\n");
         }
      }
    });
    
    connection.on('login', function (message) {
      logger.debug(`Login event: message from login ${message}`); 
    });
    
    connection.on('close', function () {
      logger.debug("Disconnecting user");
      managerWS.checkConnection(connection);
    });
});