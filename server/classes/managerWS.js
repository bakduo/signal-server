/*
* Copyright 2019 bakduo Licensed under MIT
* See license text at https://mit-license.org/license.txt
*/
const { logger }= require('../config/config');


class Operation {

  constructor(n){
    this.name=n;
  }

  setName(n){
    this.name=n;
  }
  
  getName(){
    return this.name;
  }

  do(connection,data,manager){
    logger.log("Ejemplo accion.");
  }
}

class ManagerOperation {

  constructor(n){
    this.name=n;
    this.operations=[];
    this.support=[];
  }

  getSupport(name){
    try {
      let tmp=this.support.find(item => item==String(name));
      if (tmp){
        return true
      }
      return false;
    } catch(e) {
      // statements
      logger.log(e);
    }
  }

  addOperation(o){
    this.support.push(o.getName());
    this.operations.push(o);
  }

  getOperation(name){
    try {
      return this.operations.find(item => item.getName()==String(name));
    } catch(e) {
      logger.log("Error al utilizar ManagerOperation con getOperation");
      logger.error(e);
    }
    return this.actionCalls.find(item => item.getName()==String(name));
  }

}

class OLogin extends Operation{

  constructor(n){
    super(n);
  }
  
  do(connection,data,manager){
    try {
      
      let usuariosRTC=manager.getUsers();
      manager.setForward(false);
      if (usuariosRTC.getUserByUsername(data.name)==null){
                  logger.log("Ingreso login");
                  //nextID = Date.now().toString();
                  manager.setNextID(Date.now().toString());
                  usuariosRTC.addUser(manager.getNextId(),data.name,true,data.mode,connection);    
                  logger.log("Connection accepted from Usuario: "+data.name);
                  usuariosRTC.getUserByUsername(data.name).getSocket().send(JSON.stringify({
                    'type': "login", 
                    'success': true,
                    'id':manager.getNextId(),
                  'username': data.name,
                  }));
        }
    } catch(e) {
      logger.log("Error en OLogin");
      logger.error(e);
    }
  }
}

class OUpdateMode extends Operation{

  constructor(n){
    super(n);
  }
  
  do(connection,data,manager){
    try {
           //forwarding = false;
           manager.setForward(false);
           logger.log("Actualizando modo de peer");
           let usuariosRTC=manager.getUsers();
           if (usuariosRTC.getUserByUsername(data.username)){
              switch (data.element){
                case 'datachannel':
                    managerWS.sendBroadcastUpdateMode(data);
                break;
                case 'extension':
                    if (usuariosRTC.getUserByUsername(data.username)!==null){
                      usuariosRTC.updateMode(data.username,data.mode);
                      managerWS.sendBroadcastUpdateMode(data);
                    }
                break
              }
           }
    } catch(e) {
      logger.log("Error en OLogin");
      logger.error(e);
    }
  }
}

class OReconnect extends Operation{

  constructor(n){
    super(n);
  }
  
  do(connection,data,manager){
    try {
           
           manager.setForward(false);
           //logger.log(data);
           let usuariosRTC=manager.getUsers();

           logger.log("Pide reconneccion al server: "+data.clientID);
           
           if (usuariosRTC.getUserByUsername(data.username)==null){ 
              //usuariosRTC.updateUser(data.clientID,true,data.mode,connection,data.username);
              usuariosRTC.addUser(data.clientID,data.username,true,data.mode,connection);
              usuariosRTC.getUserById(data.clientID).getSocket().send(JSON.stringify({
                'type': "updateconnection",
                'id': data.clientID,
              }));
           }else{
              logger.log("Usuario ya existe no se puede reconectar.");
           }

    } catch(e) {
      logger.log("Error en OReconnect");
      logger.error(e);
    }
  }
}


class OListUsers extends Operation{

  constructor(n){
    super(n);
  }
  
  do(connection,data,manager){
    try {
           
            manager.setForward(false);
            let usuariosRTC=manager.getUsers();
            let listaUsuariosConectados = usuariosRTC.getUsers();
            let listaUsuarios = [];
            for (let j=0; j<listaUsuariosConectados.length; j++){
                  let client = listaUsuariosConectados[j];
                  if (client.getUsername()!==null && client.getUsername().length > 0) {
                      if (client.getUsername()!==data.who){
                      let obj = {
                          who:client.getUsername(),
                          id:client.getId(),
                          mode:client.getMode(),
                      }
                      listaUsuarios.push(obj);
                      }
                  }
            }

            connection.send(JSON.stringify({
                'type': "listUsers", 
                'usersonline': listaUsuarios,
            }));

           
    } catch(e) {
      logger.log("Error en OListUsers");
      logger.error(e);
    }
  }
}

class ODelete extends Operation{

  constructor(n){
    super(n);
  }
  
  do(connection,data,manager){
    try {
        
        manager.setForward(false);
        let usuariosRTC=manager.getUsers();
         logger.log("cerrando session del usuario: "+data.target);
            usuariosRTC.deleteUser(data.target);
            connection.send(JSON.stringify({
              'type': "confirmdelete",
              'target': data.target
            }));   


    } catch(e) {
      logger.log("Error en ODelete");
      logger.error(e);
    }
  }
}

class OBroadcast extends Operation{

  constructor(n){
    super(n);
  }
  
  do(connection,data,manager){
    try {
        
        manager.setForward(false);
        let usuariosRTC=manager.getUsers();
        //sendBroadcast(data);
        let usuariosConectados = usuariosRTC.getUsers();
        for (let i=0;i<usuariosConectados.length; i++){
          if (usuariosConectados[i].getId()!== data.id && usuariosConectados[i].getUsername()!== data.username){
             usuariosConectados[i].getSocket().send(JSON.stringify({
              'type': "appendUser",
              'id': data.id,
              'username': data.username,
              'mode': data.mode,
              'spec': data.spec
             }));
          }
        }

    } catch(e) {
      logger.log("Error en OBroadcast");
      logger.error(e);
    }
  }
}

class OCheckConnectionPeer extends Operation{

  constructor(n){
    super(n);
  }
  
  do(connection,data,manager){
    try {
        manager.setForward(false);
        manager.checkConnection();
    } catch(e) {
      logger.log("Error en OCheckConnectionPeer");
      logger.error(e);
    }
  }
}

class OCallComand extends Operation{

  constructor(n){
    super(n);
  }
  
  do(connection,data,manager){
    try {
      manager.setForward(false);
      logger.log("Ejecutar comando remoto");
      manager.sendCommandtoUser(data);
    } catch(e) {
      logger.log("Error en OCallComand");
      logger.error(e);
    }
  }
}

class OAckSession extends Operation{

  constructor(n){
    super(n);
  }
  
  do(connection,data,manager){
    try {
      manager.setForward(false);
      let usuariosRTC=manager.getUsers();
      usuariosRTC.getUserByUsername(data.target).getSocket().send(JSON.stringify(data));
    } catch(e) {
      logger.log("Error en OAckSession");
      logger.error(e);
    }
  }
}

class OToUser extends Operation{

  constructor(n){
    super(n);
  }
  
  do(connection,data,manager){
    try {
      
      manager.setForward(false);
      let usuariosRTC=manager.getUsers();
      usuariosRTC.getUserByUsername(data.target).getSocket().send(JSON.stringify({
            'type': "responsebroadcast",
            'id': data.source_id,
            'username': data.source,
            'mode':data.mode,
            'spec':data.spec
      }));

    } catch(e) {
      logger.log("Error en OCheckConnectionPeer");
      logger.error(e);
    }
  }
}

class OUpdateSession extends Operation{

  constructor(n){
    super(n);
  }
  
  do(connection,data,manager){
    try {
      manager.setForward(false);
      manager.sendBroadcastUpdateSession(data);
    } catch(e) {
      logger.log("Error en OUpdateSession");
      logger.error(e);
    }
  }
}


class ManagerWS {
    
    constructor(){
        this.ws;
        this.usuarios;
        this.nextID=-1;
        this.forward=false;
        this.operations=new ManagerOperation();
        /*********Genera operaciones*************/
        this.operations.addOperation(new OUpdateSession("updatesession"));
        this.operations.addOperation(new OToUser("touser"));
        this.operations.addOperation(new OCallComand("callCommand"));
        this.operations.addOperation(new OCheckConnectionPeer("checkConnectionPeer"));
        this.operations.addOperation(new OBroadcast("broadcast"));
        this.operations.addOperation(new ODelete("delete"));
        this.operations.addOperation(new OListUsers("listUsers"));
        this.operations.addOperation(new OReconnect("reconnect"));
        this.operations.addOperation(new OLogin("login"));
        this.operations.addOperation(new OUpdateMode("updatemode"));
        this.operations.addOperation(new OAckSession("ackSession"));
        /********Fin operaciones****************/
    }

    handler(){
      return this.operations;
    }

    setForward(t){
      this.forward=t;
    }

    getForward(){
      return this.forward;
    }

    setNextID(num){
      this.nextID=num;
    }

    getNextId(){
      return this.nextID;
    }

    setWS(ws){
        this.ws=ws;
    }

    setUsers(users){
        this.usuarios=users;
    }

    getUsers(){
        return this.usuarios;
    }

    getWS(){
        return this.ws;
    }

    sendCommandtoUser(jsondata){
        try {
            let mode=null;
            //let conection=null;
            let data_remote = JSON.parse(jsondata.data);
            
            logger.log("Send command to user:");
            logger.log(jsondata);
            
            let client = this.usuarios.getUserByUsername(jsondata.target);
            
            if (jsondata.mode!==undefined && jsondata.mode!==null){
            mode=jsondata.mode;
            }
        
            client.getSocket().send(JSON.stringify({
                'type': "rpc",
                'id': data_remote.source_id,
                'username': data_remote.source,
                'method': data_remote.method,
                'data': jsondata.data,
                'mode':mode
            }));    
        }catch (error){
            logger.log(error);
        }
    }

    sendBroadcastUpdateSession(data){
        try {
            let remote_user=data.data;
            let usuariosConectados = this.usuarios.getUsers();
            //for (i=0; i<connectionArray.length; i++) {
            for (let i=0; i< usuariosConectados.length; i++) {
            //el peer que envia el broadcast update, tiene que enviarlo hacia todos los peers conectados en el signal-server salvo el mismo.
            //de esta forma solo envia la actualizacion a todos aquellos que desconocen que sesiones tiene el peer que origina el broadcast
                if (usuariosConectados[i].getId() !== remote_user.id && usuariosConectados[i].getUsername() !== remote_user.username && usuariosConectados[i].getUsername() !==remote_user.source){ 
                    logger.log("Enviar update session hacia :"+usuariosConectados[i].getUsername());
                    usuariosConectados[i].getSocket().send(JSON.stringify(data));
                }
            }    
        } catch (error) {
            logger.log(error);
        }
    }

    sendBroadcastUpdateMode(data){
        let usuariosConectados = this.usuarios.getUsers();
          for (let i=0; i<usuariosConectados.length; i++) {  
            if (usuariosConectados[i].getId()!==data.id && usuariosConectados[i].getUsername()!==data.username){
              usuariosConectados[i].getSocket().send(JSON.stringify({
                'type': "updatemode",
                'data': data
              }));
            }
        }
    }

    sendBroadcastDelete(data){
        
        let usuariosConectados = this.usuarios.getUsers();
        for (let i=0; i<usuariosConectados.length; i++){
          if (usuariosConectados[i].getId() !== data.id && usuariosConectados[i].getUsername() !== data.username){  
            usuariosConectados[i].getSocket().send(JSON.stringify({
              'type': "deleteUser",
              'id': data.id,
              'username': data.username,
             }));
          }
        }
    }

    checkConnection(){
        try {
          let eliminarUsuarios=[];
          let usuariosConectados = this.usuarios.getUsers();
          for (let i=0; i<usuariosConectados.length; i++){
            if (usuariosConectados[i]){
                logger.log("Activo: "+i);
                logger.log(usuariosConectados[i].getState());
                if ((usuariosConectados[i].getState()===null || usuariosConectados[i].getState()===undefined)){
                    //estado cerrado
                    let delete_user={
                        'target':usuariosConectados[i].getUsername(),
                        'id':usuariosConectados[i].getId()
                    }
                    eliminarUsuarios.push(delete_user);
                    this.sendBroadcastDelete(delete_user);
                }else{
                    switch (usuariosConectados[i].getState()){
                        case 3:
                          //estado cerrado
                          let delete_user={
                            'target':usuariosConectados[i].getUsername(),
                            'id':usuariosConectados[i].getId()
                          }
                          eliminarUsuarios.push(delete_user);
                          this.sendBroadcastDelete(delete_user);
                          logger.log("Estado de la coneccion cerrado.");
                          break;
                        case 1:
                          //Abierto
                        break;
                    }
                }  
            }
          }
          for (let j=0;j<eliminarUsuarios.length;j++){
            this.usuarios.deleteUser(eliminarUsuarios[j].target);
          }
        } catch(e) {
          logger.log("Error al realizar check de conection.");
          logger.log(e);
        }
    }
}

module.exports={
    ManagerWS
}