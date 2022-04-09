/*
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
        let estado=null;
        try {
            if (this.socket.readyState){
                estado = this.socket.readyState;
            }
        }catch (error){
            logger.error(error);
        }finally{
            return estado;
        }
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
  
        let backup_vector = this.sockets.filter(elemento=>{
          return elemento.getUsername()!==username
        });
      
        if (backup_vector.length===this.sockets.length){
            logger.info("No fue eliminado el usuario: "+username);
        }
        
        this.sockets = backup_vector;
      }

    updateUser(id,estado,mode,socket,username){
        try {
            
            let userTMP = this.getUserByUsername(username);
            this.deleteUser(username);
            userTMP.setUsername(username)
            userTMP.setSocket(socket);
            userTMP.setConnected(estado);
            userTMP.setMode(mode);
            userTMP.setId(id);
            this.sockets.push(userTMP);

        } catch (error) {
            logger.error(error);
        }
    }

    updateMode(username,mode){
        this.getUserByUsername(username).setMode(mode);
    }

    getUserByUsername(username){

        /*
        let socket = this.sockets.filter( socket => {
            return socket.id === id;
        })[0];

        */
        let usuario = null;
        let busqueda = this.sockets.findIndex(item => {
            return item.getUsername() === username;
        });

        if (busqueda>=0){
            usuario = this.sockets[busqueda];
        }   
        return usuario;
    }

    getUserById(id){
        let usuario=null;
        let busqueda = this.sockets.findIndex(item => {
            return item.getId()===id
        });
        
        if (busqueda>=0){
            usuario = this.sockets[busqueda];
        }
        return usuario;
    }

    getUsers(){
      return this.sockets;  
    }

    searchUser(id){

        let personaBorrada = this.getUser(id);

        let tmpPersonas = this.sockets.filter( socket => {
            return socket.id != id;
        })

        this.personas = tmpPersonas;

        return personaBorrada;
    }

}


module.exports = {
    UsersRTC
}