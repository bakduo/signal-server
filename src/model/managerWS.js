/*
* Copyright 2022 bakduo Licensed under MIT
* Copyright 2019 bakduo Licensed under MIT
* See license text at https://mit-license.org/license.txt
*/
const { logger }= require('../config/config');

const collaborates = (connection,data,manager) => {
  return {
    connection:(connection || null),
    payload: (data || null),
    manager: (manager || null),
  }
}

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

  do(obj){
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
  
  //do(connection,payload,manager){
  do(obj){
      const usersRTC=obj.manager.getUsers();
      obj.manager.setForward(false);
      if (!usersRTC.getUserByUsername(obj.payload.name)){
          logger.info(`Ingreso login ${obj.payload.name}`);
          obj.manager.setNextID(Date.now().toString());
          usersRTC.addUser(obj.manager.getNextId(),obj.payload.name,true,obj.payload.mode,obj.connection);
          logger.info(`Connection accepted from Usuario: ${obj.payload.name}`);
          usersRTC.getUserByUsername(obj.payload.name).getSocket().send(JSON.stringify({
            'type': "login", 
            'success': true,
            'id':obj.manager.getNextId(),
          'username': `${obj.payload.name}`,
          }));
          return true;
      }
      return false;
  }
}

class OUpdateMode extends Operation{

  constructor(n){
    super(n);
  }
  
  //do(connection,data,manager){
    do(obj){

      //forwarding = false;
      obj.manager.setForward(false);
      
      logger.debug("Update peer mode");
      
      let usersRTC=obj.manager.getUsers();
      
      if (!usersRTC.getUserByUsername(obj.payload.username)){
        logger.debug(`OUpdateMode not permit work without user: ${obj.payload.username}`);
      }

      if (usersRTC.getUserByUsername(obj.payload.username)){
        switch (obj.payload.element){
          case 'datachannel':
            obj.manager.sendBroadcastUpdateMode(obj.payload);
          break;
          case 'extension':
              if (usersRTC.getUserByUsername(obj.payload.username)!==null){
                usersRTC.updateMode(obj.payload.username,obj.payload.mode);
                obj.manager.sendBroadcastUpdateMode(obj.payload);
              }
          break
        }
        return true;

      }
      return false;
  }
}

class OReconnect extends Operation{

  constructor(n){
    super(n);
  }
  
  //do(connection,data,manager){
  do(obj){
      obj.manager.setForward(false);
      logger.debug(obj.payload);
      let usersRTC=obj.manager.getUsers();
      if (!usersRTC.getUserByUsername(obj.payload.username)){
        logger.info(`Pide reconneccion al server: ${obj.payload.clientID}`);
        //usersRTC.updateUser(data.clientID,true,data.mode,connection,data.username);
        usersRTC.addUser(obj.payload.clientID,obj.payload.username,true,obj.payload.mode,obj.connection);
        usersRTC.getUserById(obj.payload.clientID).getSocket().send(JSON.stringify({
          'type': "updateconnection",
          'id': `${obj.payload.clientID}`,
        }));
        return true;
      }else{
        logger.info("User that's exist don't use reconnect");
        return false;
      }
  }
}


class OListUsers extends Operation{

  constructor(n){
    super(n);
  }
  
  //do(connection,data,manager){
    do(obj){
        obj.manager.setForward(false);

        let usersRTC=obj.manager.getUsers();
        
        if (usersRTC.getUsers().length>0){
          const listaUsuarios = usersRTC.getUsers().map((item)=>{
            if (item.getUsername()) {
              if (client.getUsername()!=`${obj.payload.who}`){
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

          return true;

        }else{
            connection.send(JSON.stringify({
              'type': "listUsers", 
              'usersonline': [],
            }));
            return false;
        }
  }
}

class ODelete extends Operation{

  constructor(n){
    super(n);
  }
  
  //do(connection,data,manager){
  do(obj){
    obj.manager.setForward(false);
    const usersRTC=obj.manager.getUsers();

    if (usersRTC.deleteUser(obj.payload.target)){
      logger.debug(`Closing session for user: ${obj.payload.target}`);
      connection.send(JSON.stringify({
        'type':"confirmdelete",
        'target':obj.payload.target
      }));
      return true;
    }
    return false;
  }
}

class OBroadcast extends Operation{

  constructor(n){
    super(n);
  }
  
  //do(connection,data,manager){    
    do(obj){
        obj.manager.setForward(false);

        let usersRTC=obj.manager.getUsers();

        try {
          usersRTC.getUsers().forEach(item => {
            if ((item.getId()!==obj.payload.id) && (item.getUsername()!==obj.payload.username)){
              logger.debug(`OBroadcast for append to user: ${obj.payload.username}`);
              item.getSocket().send(JSON.stringify({
                'type': "appendUser",
                'id': obj.payload.id,
                'username': `${obj.payload.username}`,
                'mode': `${obj.payload.mode}`,
                'spec': obj.payload.spec,
              }));
            }
          });
          return true;  
        } catch (error) {
          logger.debug(`OBroadcast debug: ${error.message}`);
          return false;
        }
  }
}

class OCheckConnectionPeer extends Operation{

  constructor(n){
    super(n);
  }

  //do(connection,data,manager){
  do(obj){
    logger.debug("OCheckConnectionPeer remote command");
    obj.manager.setForward(false);
    obj.manager.checkConnection();
    return true;
  }

}

class OCallComand extends Operation{

  constructor(n){
    super(n);
  }
  
  //do(connection,data,manager){
  do(obj){
    try {
      obj.manager.setForward(false);
      logger.debug("OCallComand remote command");
      obj.manager.sendCommandtoUser(obj.payload);
      return true;
    } catch (error) {
      logger.debug(`OCallComand fail: ${error.message}`);
      return false;
    }
      
  }
}

class OAckSession extends Operation{

  constructor(n){
    super(n);
  }
  
  //do(connection,data,manager){
  do(obj){
      obj.manager.setForward(false);
      let usersRTC=obj.manager.getUsers();
      if (usersRTC.getUserByUsername(obj.payload.target)){
        usersRTC.getUserByUsername(obj.payload.target).getSocket().send(JSON.stringify(obj.payload));
        return true;
      }
      return false;
  }
}

class OToUser extends Operation{

  constructor(n){
    super(n);
  }
  
  //do(connection,data,manager){
  do(obj){

      obj.manager.setForward(false);

      let usersRTC=obj.manager.getUsers();

      logger.debug(`OToUser responsebroadcast: of ${obj.payload.target} to ${obj.payload.source} `);

      if (usersRTC.getUserByUsername(obj.payload.target)){
          usersRTC.getUserByUsername(obj.payload.target).getSocket().send(JSON.stringify({
            'type': "responsebroadcast",
            'id': obj.payload.sourceId,
            'username': obj.payload.source,
            'mode':obj.payload.mode,
            'spec':obj.payload.spec
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
  
  //do(connection,data,manager){
  do(obj){
    try {
      obj.manager.setForward(false);
      obj.manager.sendBroadcastUpdateSession(obj.payload);
      return true;
    } catch (error) {
      logger.debug(`OUpdateSession debug: ${error.message}`);
      return false;
    }
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
              'id': dataRemote.sourceId,
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

        if (userConnected.length>0){
          userConnected.forEach((item)=>{
            if (item.getId()!==remoteUser.id && item.getUsername()!=`${remoteUser.username}` && item.getUsername()!=`${remoteUser.source}`){
              logger.debug(`Send update session to :${item.getUsername()}`);
              item.getSocket().send(JSON.stringify(payload));
            }
          });
        }
    }

    sendBroadcastUpdateMode(payload){
        let userConnected = this.users.getUsers();
        if (userConnected.length>0){
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
       
        if (userConnected.length>0){
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

    checkConnection(connection){

          let usersForDelete=[];
          
          let userConnected = this.users.getUsers();

          //logger.debug(`Socket count : ${this.ws.clients}`);

          logger.debug(`Count user connected: ${userConnected.length}`);
        
          if (userConnected.length>0){

            userConnected.forEach((item)=>{

              if (item){

                //console.log(item);
                
                logger.debug(`Socket: ${item.getUsername()} ${item.getState()}`);

                if ((item.getState()===null || item.getState()===undefined)){
                  //estado cerrado
                  logger.debug(`Socket state dosen't exists ${item.getUsername()} ${item.getState()}`);
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
                      logger.debug(`Socket state closed ${item.getUsername()} ${item.getState()}`);
                      let deleteUser={
                        'target':item.getUsername(),
                        'id':item.getId()
                      }
                      usersForDelete.push(deleteUser);
                      this.sendBroadcastDelete(deleteUser);
                      logger.debug(`State connection for user: ${deleteUser}.`);
                      break
                    case 1:
                      logger.debug(`State connection open for user: ${item.getUsername()}.`);
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
    ManagerWS,
    collaborates
}