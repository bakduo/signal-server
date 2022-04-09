
/*
* Copyright 2019 bakduo Licensed under MIT
* See license text at https://mit-license.org/license.txt
*/
//require("./config/config.js");
var nextID = Date.now().toString();
const WebSocketServer = require('ws').Server;
const { UsersRTC } = require ("./classes/usuarios");
const { ManagerWS } = require ("./classes/managerWS");
const { logger, port }= require('./config/config');

const usuariosRTC=new UsersRTC();
const wss = new WebSocketServer({ port: port });
const managerWS = new ManagerWS();

managerWS.setUsers(usuariosRTC);
managerWS.setWS(wss);
managerWS.setNextID(nextID);

managerWS.getWS().on('listening', function (){
	//console.log("Server started with port "+port);
  logger.info("Server started with port "+port)
});

managerWS.getWS().on('connection', function (connection){
    
    // Accept the request and get a connection.
    if (connection.remoteAddress){
      logger.info("Connection accepted from " + connection.remoteAddress + ".");
    }
    
    connection.on('message', function (message) {
      
      logger.info("User connected");
      logger.info("message from user: "+message);
      
      var data = JSON.parse(message);

      //console.log("datos del mensaje: "+ JSON.stringify(data));
      managerWS.setForward(true);

      try {
        if (managerWS.handler().getSupport(data.type)){
          managerWS.handler().getOperation(data.type).do(connection,data,managerWS);
        }else{
          logger.info("Operacion no soportado por el manager: "+data.type);  
        }
      } catch(e) {
        logger.info("Handler de operacion desconocida: "+data.type);
        logger.error(e);
      }
      
      //si no es login entonces sera que nos llegan mensajes de los peers para interactuar.
      //se garantiza que cada peer puede interactuar con el servidor hasta que esten en "pares".
      //if (forwarding){  
      if (managerWS.getForward()){
         if (data.target && data.target !== undefined && data.target.length !== 0){
              logger.info("usuario: "+data.target);
              if (usuariosRTC.getUserByUsername(data.target).getMode()!=="manager"){
               //Debug INFO FORWARD
               switch (data.type){
                 case "candidate":
                   // statements_1
                   logger.info("Candidate este mensaje lo envia : "+data.who+" para: "+data.target+"\n");
                   break;
                 case "offer":
                  logger.info("Offer este mensaje lo envia : "+data.who+" para: "+data.target+"\n");
                   break;
                 case "answer":
                  logger.info("Answer este mensaje lo envia : "+data.who+" para: "+data.target+"\n");
                   break;
               }
               usuariosRTC.getUserByUsername(data.target).getSocket().send(JSON.stringify(data));
            }else{
              logger.info("No se envian datos de ofertas de conexion a usuarios manager.");
            }
         }else{
          logger.info("No es forward para un usuario.\n");
         }
      }

    });
    
    
    connection.on('login', function (message) {
      logger.info("message from login"); 
    });
    
    connection.on('close', function () {
      logger.info("Disconnecting user");
       managerWS.checkConnection();
    });
});