/*
 * Copyright 2024 bakduo Licensed under MIT
 * See license text at https://mit-license.org/license.txt
 */
const { logger } = require("../config/config");

const collaborates = (connection, data, manager) => {
  return {
    connection: connection || null,
    payload: data || null,
    manager: manager || null,
  };
};

class Queue {
  constructor() {
    this.queue = [];
  }

  add(element) {
    // add element
    return this.queue.push(element);
  }

  remove() {
    if (this.queue.length > 0) {
      return this.queue.shift(); // remove first element
    }
  }

  size() {
    return this.queue.length;
  }

  isEmpty() {
    return this.queue.length == 0;
  }

  clear() {
    this.queue = [];
  }
}

class Operation {
  constructor(n) {
    this.name = n;
  }

  setName(n) {
    this.name = n;
  }

  getName() {
    return this.name;
  }

  do(obj) {
    logger.info(`TODO.${obj}`);
  }
}

class ManagerOperation {
  constructor(n) {
    this.name = n;
    this.operations = [];
    this.support = [];
  }

  getSupport(name) {
    let itemSupport = this.support.find((item) => item == String(name));
    if (itemSupport) {
      return true;
    }
    return false;
  }

  addOperation(o) {
    this.support.push(o.getName());
    this.operations.push(o);
  }

  getOperation(name) {
    let operation = this.operations.find(
      (item) => item.getName() == String(name),
    );
    if (operation) {
      return operation;
    }
    return false;
  }
}

class OLogin extends Operation {
  constructor(n) {
    super(n);
  }

  //do(connection,payload,manager){
  do(obj) {
    const conecctionsOnline = obj.manager.getUsers();

    const manager = obj.manager;

    manager.setForward(false);

    if (!conecctionsOnline.getUserByUsername(obj.payload.name)) {
      logger.info(`Ingreso login ${obj.payload.name}`);

      manager.setNextID(Date.now().toString());

      conecctionsOnline.addUser(
        manager.getNextId(),
        obj.payload.name,
        true,
        obj.payload.mode,
        obj.connection,
        obj.payload.visible,
      );

      logger.info(`Connection accepted from Usuario: ${obj.payload.name}`);

      let socketClient = conecctionsOnline
        .getUserByUsername(obj.payload.name)
        .getSocket();

      socketClient.send(
        JSON.stringify({
          type: "login",
          success: true,
          id: manager.getNextId(),
          username: `${obj.payload.name}`,
          status: 0,
        }),
      );
      return true;
    } else {
      logger.info(`Again Ingreso login ${obj.payload.name}`);
      let user = conecctionsOnline.getUserByUsername(obj.payload.name);
      user.setSocket(obj.connection);
      conecctionsOnline
        .getUserByUsername(obj.payload.name)
        .getSocket()
        .send(
          JSON.stringify({
            type: "login",
            success: true,
            id: user.getId(),
            username: user.getUsername(),
            status: 0,
            already: 1,
          }),
        );
      return true;
    }
  }
}

class OUpdateMode extends Operation {
  constructor(n) {
    super(n);
  }

  //do(connection,data,manager){
  do(obj) {
    //forwarding = false;
    obj.manager.setForward(false);

    logger.debug("Update peer mode");

    let conecctionsOnline = obj.manager.getUsers();

    if (!conecctionsOnline.getUserByUsername(obj.payload.username)) {
      logger.debug(
        `OUpdateMode not permit work without user: ${obj.payload.username}`,
      );
    }

    if (conecctionsOnline.getUserByUsername(obj.payload.username)) {
      switch (obj.payload.element) {
        case "datachannel":
          obj.manager.sendBroadcastUpdateMode(obj.payload);
          break;
        case "extension":
          if (conecctionsOnline.getUserByUsername(obj.payload.username) !== null) {
            conecctionsOnline.updateMode(obj.payload.username, obj.payload.mode);
            obj.manager.sendBroadcastUpdateMode(obj.payload);
          }
          break;
      }
      return true;
    }
    return false;
  }
}

class OReconnect extends Operation {
  constructor(n) {
    super(n);
  }

  //do(connection,data,manager){
  do(obj) {
    obj.manager.setForward(false);
    logger.debug(obj.payload);
    let conecctionsOnline = obj.manager.getUsers();
    if (!conecctionsOnline.getUserByUsername(obj.payload.username)) {
      logger.info(`Pide reconneccion al server: ${obj.payload.clientID}`);
      //conecctionsOnline.updateUser(data.clientID,true,data.mode,connection,data.username);
      conecctionsOnline.addUser(
        obj.payload.clientID,
        obj.payload.username,
        true,
        obj.payload.mode,
        obj.connection,
      );
      conecctionsOnline
        .getUserById(obj.payload.clientID)
        .getSocket()
        .send(
          JSON.stringify({
            type: "updateconnection",
            id: `${obj.payload.clientID}`,
            status: 0,
          }),
        );
      return true;
    } else {
      logger.info("User that's exist don't use reconnect");
      return false;
    }
  }
}

class OListUsers extends Operation {
  constructor(n) {
    super(n);
  }

  //do(connection,data,manager){
  do(obj) {
    obj.manager.setForward(false);

    let conecctionsOnline = obj.manager.getUsers();

    if (conecctionsOnline.getUsers().length > 0) {
      let listado = [];

      conecctionsOnline.getUsers().forEach((item) => {
        if (
          item.getVisible() == 1 &&
          item.getUsername() != `${obj.payload.who}`
        ) {
          listado.push({
            who: item.getUsername(),
            id: item.getId(),
            mode: item.getMode(),
          });
        }
      });

      obj.connection.send(
        JSON.stringify({
          type: "listUsers",
          usersonline: listado,
          status: 0,
        }),
      );

      return true;
    } else {
      obj.connection.send(
        JSON.stringify({
          type: "listUsers",
          usersonline: [],
          status: 0,
        }),
      );
      return false;
    }
  }
}

class ODelete extends Operation {
  constructor(n) {
    super(n);
  }

  //do(connection,data,manager){
  do(obj) {
    obj.manager.setForward(false);
    const conecctionsOnline = obj.manager.getUsers();

    if (conecctionsOnline.deleteUser(obj.payload.target)) {
      logger.debug(`Closing session for user: ${obj.payload.target}`);
      obj.connection.send(
        JSON.stringify({
          type: "confirmdelete",
          target: obj.payload.target,
          status: 0,
        }),
      );
      return true;
    }
    return false;
  }
}

class OBroadcast extends Operation {
  constructor(n) {
    super(n);
  }

  //do(connection,data,manager){
  do(obj) {
    obj.manager.setForward(false);

    let conecctionsOnline = obj.manager.getUsers();

    try {
      conecctionsOnline.getUsers().forEach((item) => {
        if (
          item.getId() !== obj.payload.id &&
          item.getUsername() !== obj.payload.username
        ) {
          logger.debug(
            `OBroadcast for append to user: ${obj.payload.username}`,
          );
          item.getSocket().send(
            JSON.stringify({
              type: "appendUser",
              id: obj.payload.id,
              username: `${obj.payload.username}`,
              mode: `${obj.payload.mode}`,
              spec: obj.payload.spec,
              status: 0,
            }),
          );
        }
      });
      return true;
    } catch (error) {
      logger.debug(`OBroadcast debug: ${error.message}`);
      return false;
    }
  }
}

class OCheckConnectionPeer extends Operation {
  constructor(n) {
    super(n);
  }

  //do(connection,data,manager){
  do(obj) {
    logger.debug("OCheckConnectionPeer remote command");
    obj.manager.setForward(false);
    obj.manager.checkConnection();
    return true;
  }
}

class OCallComand extends Operation {
  constructor(n) {
    super(n);
  }

  //do(connection,data,manager){
  do(obj) {
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

class OAckSession extends Operation {
  constructor(n) {
    super(n);
  }

  //do(connection,data,manager){
  do(obj) {
    obj.manager.setForward(false);
    let conecctionsOnline = obj.manager.getUsers();
    if (conecctionsOnline.getUserByUsername(obj.payload.target)) {
      conecctionsOnline
        .getUserByUsername(obj.payload.target)
        .getSocket()
        .send(JSON.stringify(obj.payload));
      return true;
    }
    return false;
  }
}

class OToUser extends Operation {
  constructor(n) {
    super(n);
  }

  //do(connection,data,manager){
  do(obj) {
    obj.manager.setForward(false);

    let conecctionsOnline = obj.manager.getUsers();

    logger.debug(
      `OToUser responsebroadcast: of ${obj.payload.target} to ${obj.payload.source} `,
    );

    if (conecctionsOnline.getUserByUsername(obj.payload.target)) {
      conecctionsOnline
        .getUserByUsername(obj.payload.target)
        .getSocket()
        .send(
          JSON.stringify({
            type: "responsebroadcast",
            id: obj.payload.sourceId,
            username: obj.payload.source,
            mode: obj.payload.mode,
            spec: obj.payload.spec,
            status: 0,
          }),
        );
      return true;
    }
    return false;
  }
}

class OUpdateSession extends Operation {
  constructor(n) {
    super(n);
  }

  //do(connection,data,manager){
  do(obj) {
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

class OSessionOperation extends Operation {
  constructor(n) {
    super(n);
    this.sessions = {};
  }

  //do(connection,data,manager){
  do(obj) {
    try {
      const manager = obj.manager;

      manager.setForward(false);

      if (obj.payload.state == "syn") {
        if (!this.sessions[obj.payload.idsession]) {
          if (obj.payload.description) {
            if (obj.payload.description.type === "offer") {
              this.sessions[obj.payload.idsession] = {
                who: obj.payload.who,
                target: obj.payload.target,
                description: obj.payload.description,
                candidates: new Queue(),
                idsession: obj.payload.idsession,
                remote: {},
              };

              const payload = {
                who: obj.payload.who,
                target: obj.payload.target,
                idsession: obj.payload.idsession,
                state: "ack",
                type: "session",
                remote: false,
                answer: false,
                feedback: false,
              };

              manager.sendPayloadByForward(obj.payload.who, payload);
            }
          }
        } else {
          if (obj.payload.state == "syn") {
            if (!obj.payload.description && obj.payload.candidate) {
              const session = this.sessions[obj.payload.idsession];
              session.candidates.add(obj.payload.candidate);
              const payloadsession = {
                type: "session",
                state: "ack",
                who: session.who,
                target: session.target,
                description: false,
                idsession: session.idsession,
                remote: true,
                feedback: false,
              };
              console.log(
                `Seria una session para ${obj.payload.who} : ${payloadsession}`,
              );
              manager.sendPayloadByForward(obj.payload.who, payloadsession);
            } else {
              if (!obj.payload.description && !obj.payload.candidate) {
                const session = this.sessions[obj.payload.idsession];

                const vector = [];

                while (!session.candidates.isEmpty()) {
                  vector.push(session.candidates.remove());
                }

                const payloadsession = {
                  type: "session",
                  state: "syn",
                  who: session.who,
                  target: session.target,
                  description: session.description,
                  candidates: vector,
                  idsession: session.idsession,
                  remote: true,
                };
                console.log(
                  `Seria una session para ${obj.payload.target} : ${payloadsession}`,
                );
                manager.sendPayloadByForward(
                  obj.payload.target,
                  payloadsession,
                );
              }
            }
          }
        }
      } else {
        if (obj.payload.state == "ack") {
          if (this.sessions[obj.payload.idsession]) {
            const session = this.sessions[obj.payload.idsession];

            if (obj.payload.description && !obj.payload.candidate) {
              session.remote = {
                who: obj.payload.who,
                target: obj.payload.target,
                description: obj.payload.description,
                candidates: new Queue(),
                idsession: obj.payload.idsession,
              };

              const payload = {
                who: obj.payload.who,
                target: obj.payload.target,
                idsession: obj.payload.idsession,
                description: false,
                state: "syn",
                type: "session",
                remote: false,
                answer: false,
              };

              manager.sendPayloadByForward(obj.payload.target, payload);
            } else {
              if (!obj.payload.description && obj.payload.candidate) {
                const session = this.sessions[obj.payload.idsession];

                session.remote.candidates.add(obj.payload.candidate);

                const payloadsession = {
                  type: "session",
                  state: "syn",
                  who: session.who,
                  target: session.target,
                  description: false,
                  idsession: session.idsession,
                  remote: true,
                };

                console.log(
                  `Seria una session para ${obj.payload.target} : ${payloadsession}`,
                );

                manager.sendPayloadByForward(
                  obj.payload.target,
                  payloadsession,
                );
              } else {
                if (!obj.payload.description && !obj.payload.candidate) {
                  console.log(`termino parte se sesion de ambos lados`);

                  const session = this.sessions[obj.payload.idsession];

                  const vector = [];

                  while (!session.remote.candidates.isEmpty()) {
                    vector.push(session.remote.candidates.remove());
                  }

                  const payloadsession = {
                    type: "session",
                    state: "ack",
                    who: session.who,
                    target: session.target,
                    description: session.remote.description,
                    candidates: vector,
                    idsession: session.idsession,
                    remote: true,
                    feedback: true,
                  };
                  console.log(
                    `Seria finalizada para ${session.who} con ${session.target}: ${payloadsession}`,
                  );

                  manager.sendPayloadByForward(session.who, payloadsession);
                }
              }
            }
          }
        }
      }
      //this.getUsers().getUserByUsername(obj.payload.target).getSocket().send(JSON.stringify(obj.payload));
    } catch (error) {
      logger.debug(`OSessionOperation debug: ${error.message}`);
      return false;
    }
  }
}

class ServiceWS {
  constructor() {
    this.ws;
    this.users;
    this.nextID = -1;
    this.forward = false;
    this.operations = new ManagerOperation();
    /*********Genera operaciones*************/
    this.operations.addOperation(new OUpdateSession("updatesession"));
    this.operations.addOperation(new OToUser("touser"));
    this.operations.addOperation(new OCallComand("callCommand"));
    this.operations.addOperation(
      new OCheckConnectionPeer("checkConnectionPeer"),
    );
    this.operations.addOperation(new OBroadcast("broadcast"));
    this.operations.addOperation(new ODelete("delete"));
    this.operations.addOperation(new OListUsers("listUsers"));
    this.operations.addOperation(new OReconnect("reconnect"));
    this.operations.addOperation(new OLogin("login"));
    this.operations.addOperation(new OUpdateMode("updatemode"));
    this.operations.addOperation(new OAckSession("ackSession"));
    this.operations.addOperation(new OSessionOperation("session"));

    /********Fin operaciones****************/
  }

  handler() {
    return this.operations;
  }

  setForward(t) {
    this.forward = t;
  }

  getForward() {
    return this.forward;
  }

  setNextID(num) {
    this.nextID = num;
  }

  getNextId() {
    return this.nextID;
  }

  setWS(ws) {
    this.ws = ws;
  }

  setUsers(users) {
    this.users = users;
  }

  getUsers() {
    return this.users;
  }

  getWS() {
    return this.ws;
  }

  sendCommandtoUser(jsondata) {
    let dataRemote = JSON.parse(jsondata.data);

    let client = this.users.getUserByUsername(jsondata.target);

    if (!client) {
      throw Error(`Don't work without User`);
    }

    if (client) {
      logger.debug(`Send command to user: ${jsondata}`);
      const mode = jsondata.mode || "";
      client.getSocket().send(
        JSON.stringify({
          type: "rpc",
          id: dataRemote.sourceId,
          username: dataRemote.source,
          method: dataRemote.method,
          data: jsondata.data,
          mode: mode,
          status: 0,
        }),
      );
      return true;
    }
    return false;
  }

  sendBroadcastUpdateSession(payload) {
    let remoteUser = payload.data;
    let userConnected = this.users.getUsers();

    if (userConnected.length > 0) {
      userConnected.forEach((item) => {
        if (
          item.getId() !== remoteUser.id &&
          item.getUsername() != `${remoteUser.username}` &&
          item.getUsername() != `${remoteUser.source}`
        ) {
          logger.debug(`Send update session to :${item.getUsername()}`);
          item.getSocket().send(JSON.stringify(payload));
        }
      });
    }
  }

  sendPayloadByForward(username, payload) {
    try {
      if (!username) {
        return false;
      }

      logger.debug(
        `usuario: ${username}: mode: ${this.getUsers().getUserByUsername(username).getMode()}`,
      );

      if (this.getUsers().getUserByUsername(username).getMode() !== "manager") {
        console.log(`Data type: ${payload.type}`);

        switch (payload.type) {
          case "candidate":
            // statements_1
            logger.debug(
              `Candidate este mensaje lo envia : ${payload.who} para: ${payload.target}\n`,
            );
            break;
          case "offer":
            logger.debug(
              `Offer este mensaje lo envia : ${payload.who} para: ${payload.target}\n`,
            );
            break;
          case "answer":
            logger.debug(
              `Answer este mensaje lo envia : ${payload.who} para: ${payload.target}\n`,
            );
            break;
          case "description":
            logger.debug(
              `description este mensaje lo envia : ${payload.who} para: ${payload.target}\n`,
            );
            break;
          case "polite":
            logger.debug(
              `polite este mensaje lo envia : ${payload.who} para: ${payload.target}\n`,
            );
            break;
          case "handshake":
            logger.debug(
              `handshake este mensaje lo envia : ${payload.who} para: ${payload.target}\n`,
            );
            break;
        }

        //console.log(payload);

        this.getUsers()
          .getUserByUsername(username)
          .getSocket()
          .send(JSON.stringify(payload));
      }
    } catch (error) {
      console.log(`Error sendPayloadByForward: ${error}`);
    }
  }

  sendBroadcastUpdateMode(payload) {
    let userConnected = this.users.getUsers();
    if (userConnected.length > 0) {
      userConnected.forEach((item) => {
        if (
          item.getId() !== payload.id &&
          item.getUsername() != `${payload.username}`
        ) {
          item.getSocket().send(
            JSON.stringify({
              type: "updatemode",
              data: payload,
              status: 0,
            }),
          );
        }
      });
    }
  }

  sendBroadcastNotify(payload, type) {
    let userConnected = this.users.getUsers();

    if (userConnected.length > 0) {
      userConnected.forEach((item) => {
        if (
          item.getId() !== payload.id &&
          item.getUsername() !== payload.username
        ) {
          item.getSocket().send(
            JSON.stringify({
              type: type,
              id: payload.id,
              username: `${payload.username}`,
              status: 0,
            }),
          );
        }
      });
    }
  }

  checkConnection() {
    let usersForDelete = [];

    let userConnected = this.users.getUsers();

    logger.debug(`Socket count : ${this.ws.clients}`);

    logger.debug(`Count user connected: ${userConnected.length}`);

    if (userConnected.length > 0) {
      let deleteUser = {}
      userConnected.forEach((item) => {
        if (item) {
    
          logger.debug(`Socket: ${item.getUsername()} ${item.getState()}`);

          if (item.getState() === null || item.getState() === undefined) {
            //estado cerrado
            logger.debug(
              `Socket state dosen't exists ${item.getUsername()} ${item.getState()}`,
            );
            deleteUser = {
              status: 0,
              target: item.getUsername(),
              id: item.getId(),
            };
            usersForDelete.push(deleteUser);
            this.sendBroadcastNotify(deleteUser, "deleteUser");
          } else {
            switch (item.getState()) {
              case 3:
                //estado cerrado
                logger.debug(
                  `Socket state closed ${item.getUsername()} ${item.getState()}`,
                );
                deleteUser = {
                  status: 0,
                  notify: "offline",
                  target: item.getUsername(),
                  id: item.getId(),
                };
                usersForDelete.push(deleteUser);
                logger.debug(`State connection for user: ${deleteUser}.`);
                this.sendBroadcastNotify(deleteUser, "notify");

                break;
              case 1:
                logger.debug(
                  `State connection open for user: ${item.getUsername()}.`,
                );
                break;
            }
          }
        }
      });

      usersForDelete.forEach((item) => {
        this.users.deleteUser(`${item.target}`);
      });
    }
  }
}

module.exports = {
  ServiceWS,
  collaborates,
};
