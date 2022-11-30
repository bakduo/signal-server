/*
* Copyright 2022 bakduo Licensed under MIT
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
    logger.info("TODO.");
  }
}

class ManagerOperation {

  constructor(n){
    this.name=n;
    this.operations=[];
    this.support=[];
  }

  getSupport(name){

    let itemSupport=this.support.find(item => item==String(name));
    if (itemSupport){
      return true
    }
    return false;
  }

  addOperation(o){
    this.support.push(o.getName());
    this.operations.push(o);
  }

  getOperation(name){
    let operation = this.operations.find(item => item.getName()==String(name));
    if (operation){
      return operation
    }
    return false
  }

}

class OLogin extends Operation{

  constructor(n){
    super(n);
  }
  
  do(connection,payload,manager){
      const usersRTC=manager.getUsers();
      manager.setForward(false);
      if (!usersRTC.getUserByUsername(payload.name)){
          logger.info(`Ingreso login ${payload.name}`);
          manager.setNextID(Date.now().toString());
          usersRTC.addUser(manager.getNextId(),payload.name,true,payload.mode,connection);    
          logger.info(`Connection accepted from Usuario: ${payload.name}`);
          usersRTC.getUserByUsername(payload.name).getSocket().send(JSON.stringify({
            'type': "login", 
            'success': true,
            'id':manager.getNextId(),
          'username': `${payload.name}`,
          }));
      }
  }
}

class OUpdateMode extends Operation{

  constructor(n){
    super(n);
  }
  
  do(connection,data,manager){

      //forwarding = false;
      manager.setForward(false);
      
      logger.debug("Update peer mode");
      
      let usersRTC=manager.getUsers();
      
      if (!usersRTC.getUserByUsername(data.username)){
        logger.debug(`OUpdateMode not permit work without user: ${data.username}`);
        //throw Error(`OUpdateMode not permit work without user: ${data.username}`);
      }

      if (usersRTC.getUserByUsername(data.username)){
        switch (data.element){
          case 'datachannel':
              manager.sendBroadcastUpdateMode(data);
          break;
          case 'extension':
              if (usersRTC.getUserByUsername(data.username)!==null){
                usersRTC.updateMode(data.username,data.mode);
                manager.sendBroadcastUpdateMode(data);
              }
          break
        }
      }

  }
}

class OReconnect extends Operation{

  constructor(n){
    super(n);
  }
  
  do(connection,data,manager){
      manager.setForward(false);
      logger.debug(data);
      let usersRTC=manager.getUsers();
      if (!usersRTC.getUserByUsername(data.username)){
        logger.info(`Pide reconneccion al server: ${data.clientID}`);
        //usersRTC.updateUser(data.clientID,true,data.mode,connection,data.username);
        usersRTC.addUser(data.clientID,data.username,true,data.mode,connection);
        usersRTC.getUserById(data.clientID).getSocket().send(JSON.stringify({
          'type': "updateconnection",
          'id': `${data.clientID}`,
        }));
      }else{
        logger.info("Usuario ya existe no se puede reconectar.");
      }
  }
}


class OListUsers extends Operation{

  constructor(n){
    super(n);
  }
  
  do(connection,data,manager){

        manager.setForward(false);

        let usersRTC=manager.getUsers();
        
        if (usersRTC.getUsers().lenght>0){
          const listaUsuarios = usersRTC.getUsers().map((item)=>{
            if (item.getUsername()) {
              if (client.getUsername()!=`${data.who}`){
                return {
                  who:client.getUsername(),
                  id:client.getId(),
                  mode:client.getMode(),
                }
              }
            }
          });
  
          connection.send(JSON.stringify({
              'type': "listUsers", 
              'usersonline': listaUsuarios,
          }));

        }else{
            connection.send(JSON.stringify({
              'type': "listUsers", 
              'usersonline': [],
            }));
        }
  }
}

class ODelete extends Operation{

  constructor(n){
    super(n);
  }
  
  do(connection,data,manager){
    manager.setForward(false);
    const usersRTC=manager.getUsers();

    if (usersRTC.deleteUser(data.target)){
      logger.debug(`Cerrando session del usuario: ${data.target}`);
      connection.send(JSON.stringify({
        'type': "confirmdelete",
        'target': data.target
      }));
    }
    return false;
  }
}

class OBroadcast extends Operation{

  constructor(n){
    super(n);
  }
  
  do(connection,data,manager){    
        manager.setForward(false);

        let usersRTC=manager.getUsers();

        usersRTC.getUsers().forEach(item => {
          if ((item.getId()!==data.id) && (item.getUsername()!==data.username)){
            logger.debug(`OBroadcast append user: ${data.username}`);
            item.getSocket().send(JSON.stringify({
              'type': "appendUser",
              'id': data.id,
              'username': `${data.username}`,
              'mode': `${data.mode}`,
              'spec': data.spec,
            }));
          }
        });
  }
}

class OCheckConnectionPeer extends Operation{

  constructor(n){
    super(n);
  }
  
  do(connection,data,manager){
    logger.debug("OCheckConnectionPeer remote command");
    manager.setForward(false);
    manager.checkConnection();
  }

}

class OCallComand extends Operation{

  constructor(n){
    super(n);
  }
  
  do(connection,data,manager){
    
      manager.setForward(false);
      logger.debug("OCallComand remote command");
      manager.sendCommandtoUser(data);
  }
}

class OAckSession extends Operation{

  constructor(n){
    super(n);
  }
  
  do(connection,data,manager){
      manager.setForward(false);
      let usersRTC=manager.getUsers();
      if (usersRTC.getUserByUsername(data.target)){
        usersRTC.getUserByUsername(data.target).getSocket().send(JSON.stringify(data));
      }
      return false;
  }
}

class OToUser extends Operation{

  constructor(n){
    super(n);
  }
  
  do(connection,data,manager){
      manager.setForward(false);
      let usersRTC=manager.getUsers();
      if (usersRTC.getUserByUsername(data.target)){
          usersRTC.getUserByUsername(data.target).getSocket().send(JSON.stringify({
            'type': "responsebroadcast",
            'id': data.source_id,
            'username': data.source,
            'mode':data.mode,
            'spec':data.spec
          }));
          return true;
      }
      return false;
      
  }
}

class OUpdateSession extends Operation{

  constructor(n){
    super(n);
  }
  
  do(connection,data,manager){
      manager.setForward(false);
      manager.sendBroadcastUpdateSession(data);
  }
}


class ManagerWS {
    
    constructor(){
        this.ws;
        this.users;
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
        this.users=users;
    }

    getUsers(){
        return this.users;
    }

    getWS(){
        return this.ws;
    }

    sendCommandtoUser(jsondata){
        let dataRemote = JSON.parse(jsondata.data);

        let client = this.users.getUserByUsername(jsondata.target);
        
        if (!client){
          throw Error(`Don't work without User`);
        }

        if (client){
          logger.debug(`Send command to user: ${jsondata}`);
          const mode=jsondata.mode || "";
          client.getSocket().send(JSON.stringify({
              'type': "rpc",
              'id': dataRemote.source_id,
              'username': dataRemote.source,
              'method': dataRemote.method,
              'data': jsondata.data,
              'mode':mode
          }));
          return true;
        }
        return false;
    }

    sendBroadcastUpdateSession(payload){
        let remoteUser=payload.data;
        let userConnected = this.users.getUsers();

        if (userConnected.lenght>0){
          userConnected.forEach((item)=>{
            if (item.getId()!==remoteUser.id && item.getUsername()!=`${remoteUser.username}` && item.getUsername()!=`${remoteUser.source}`){
              logger.debug(`Enviar update session hacia :${item.getUsername()}`);
              item.getSocket().send(JSON.stringify(data));
            }
          });
        }
    }

    sendBroadcastUpdateMode(payload){
        let userConnected = this.users.getUsers();
        if (userConnected.lenght>0){
          userConnected.forEach((item)=>{
            if (item.getId()!==payload.id && item.getUsername()!=`${payload.username}`){
              userConnected[i].getSocket().send(JSON.stringify({
                'type': "updatemode",
                'data': payload
                }));
            }
          });
        }
    }

    sendBroadcastDelete(payload){
        
        let userConnected = this.users.getUsers();
       
        if (userConnected.lenght>0){
          userConnected.forEach((item)=>{
            if (item.getId() !== payload.id && item.getUsername() !== payload.username){
              item.getSocket().send(JSON.stringify({
                'type': "deleteUser",
                'id': payload.id,
                'username': `${payload.username}`,
                }));
              }
            }
          );
        }
        
    }

    checkConnection(){
          let usersForDelete=[];
          let userConnected = this.users.getUsers();
        
          if (userConnected.lenght>0){
            userConnected.forEach((item)=>{
              if (item){
                logger.debug(item.getState());
                if ((item.getState()===null || item.getState()===undefined)){
                  //estado cerrado
                  let deleteUser={
                    'target':item.getUsername(),
                    'id':item.getId()
                  }
                  usersForDelete.push(deleteUser);
                  this.sendBroadcastDelete(deleteUser);
                }else{
                  switch (item.getState()){
                    case 3:
                      //estado cerrado
                      let deleteUser={
                        'target':item.getUsername(),
                        'id':item.getId()
                      }
                      usersForDelete.push(deleteUser);
                      this.sendBroadcastDelete(deleteUser);
                      logger.debug("Estado de la conexión cerrado.");
                      break
                    case 1:
                      logger.debug("Estado de la conexión abierto.");
                      break;
                  }
                }
              }
            });
  
            usersForDelete.forEach((item)=>{
              this.users.deleteUser(`${item.target}`);
            });
          }
    }
}

module.exports={
    ManagerWS
}