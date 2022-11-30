/*
* Copyright 2022 bakduo Licensed under MIT
* Copyright 2019 bakduo. Licensed under MIT
* See license text at https://mit-license.org/license.txt
*/

const { logger }= require('../config/config');

class ClientWS {

    constructor(){
        this.clientID=-1;
        this.username="";
        this.mode="";
        this.socket=null;
        this.stateConnected=false;
    }

    setConnected(state){
        this.stateConnected=state;
    }

    getConnected(){
        return this.this.stateConnected;
    }

    setUsername(name){
        this.username=name;
    }

    getUsername(){
        return this.username;
    }

    setMode(mode){
        this.mode=mode;
    }

    getMode(){
        return this.mode;
    }

    setId(id){
        this.clientID=id;
    }

    getId(){
        return this.clientID;
    }

    setSocket(socket){
        this.socket=socket;
    }

    getSocket(){
        return this.socket;
    }
    
    getState(){

        if (!this.socket.readyState){
            throw Error(`Not permit without state`);    
        }
        
        return this.socket.readyState;
    }

}

class UsersRTC {
    
    constructor(){
        this.sockets = [];
    }

    addUser(id,name,estado,mode,socket){
        
        let socketWS = new ClientWS();

        socketWS.setId(id);
        socketWS.setMode(mode);
        socketWS.setUsername(name);
        socketWS.setSocket(socket);
        socketWS.setConnected(estado);
        this.sockets.push(socketWS);
    }

    deleteUser(username){

        let backupVector = this.sockets.filter(elemento=>{
          return (elemento.getUsername()!==username)
        });
      
        if (backupVector.length>0){
            logger.debug(`Socket user delete: ${username}`);
            this.sockets = backupVector;
            return this.sockets;
        }
        
        return false;
      }

    updateUser(id,estado,mode,socket,username){

        let userTMP = this.getUserByUsername(username);
        if (userTMP){
            if(this.deleteUser(username)){
                userTMP.setUsername(username)
                userTMP.setSocket(socket);
                userTMP.setConnected(estado);
                userTMP.setMode(mode);
                userTMP.setId(id);
                this.sockets.push(userTMP);
                return true;
            };
            
        }
        return false;
    }

    updateMode(username,mode){
        if (this.getUserByUsername(username)){
            this.getUserByUsername(username).setMode(mode);
            return true;
        }
        return false;
    }

    getUserByUsername(username){

        let busqueda = this.sockets.findIndex(item => {
            return item.getUsername() === username;
        });

        if (busqueda>=0){
            return this.sockets[busqueda];
        }

        return false;
        
    }

    getUserById(id){
        let busqueda = this.sockets.findIndex(item => {
            return item.getId()===id
        });
        
        if (busqueda>=0){
            return this.sockets[busqueda];
        }
        return false;
    }

    getUsers(){
      return this.sockets;  
    }

    searchUser(id){

        let userDeleted = this.getUserById(id);

        if (userDeleted){
            return userDeleted;
        }

        return false;
    }

}


module.exports = {
    UsersRTC
}