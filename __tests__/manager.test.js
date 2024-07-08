const { ClientWS, CollectionWS } = require("../src/model/client");

const { ServiceWS, collaborates } = require("../src/model/managerWS");

const { WS } = require("jest-websocket-mock");

// const { logger }= require('../src/config/config');

const generateRandomString = (myLength) => {
  const chars =
    "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890";
  const randomArray = Array.from(
    { length: myLength },
    () => chars[Math.floor(Math.random() * chars.length)],
  );

  const randomString = randomArray.join("");
  return randomString;
};

const fakeURL = "ws://localhost:8080";

describe("Test Manager", () => {
  test("Test instance ", () => {
    const manager = new ServiceWS();
    expect(manager).not.toEqual(null);
  });

  test("Test operation login support ", async () => {
    const manager = new ServiceWS();

    const mockServer = new WS(fakeURL);

    manager.setWS(mockServer);

    let nextID = Date.now().toString();

    manager.setNextID(nextID);

    const users = new CollectionWS();

    const c1 = new ClientWS();

    c1.setMode("offline");

    c1.setUsername(generateRandomString(10));

    manager.setForward(true);

    c1.setSocket(new WebSocket(fakeURL));
    await mockServer.connected;

    const socketCliente = c1.getSocket();

    manager.setUsers(users);

    socketCliente.send(
      JSON.stringify({
        type: "login",
        name: c1.getUsername(),
        visible: 0,
      }),
    );

    await expect(mockServer).toReceiveMessage(
      JSON.stringify({
        type: "login",
        name: c1.getUsername(),
        visible: 0,
      }),
    );

    let message = null;

    socketCliente.onmessage = (e) => {
      message = JSON.parse(e.data);
    };

    //id,name,estado,mode,socket
    //obj.payload.name,true,obj.payload.mode,obj.connection

    let payload = {
      name: c1.getUsername(),
      mode: "hybrid",
      connection: socketCliente,
    };

    manager
      .handler()
      .getOperation("login")
      .do(collaborates(mockServer, payload, manager));

    expect(message.type).toEqual("login");
    expect(message.success).toEqual(true);
    expect(message.username).toEqual(c1.getUsername());
    expect(users.getUsers().length).toEqual(1);

    mockServer.close();

    await mockServer.closed;
  });

  test("Test operation login after that run operation toUser support ", async () => {
    const manager = new ServiceWS();

    const mockServer = new WS(fakeURL);

    manager.setWS(mockServer);

    let nextID = Date.now().toString();

    manager.setNextID(nextID);

    const users = new CollectionWS();

    const c1 = new ClientWS();
    const c2 = new ClientWS();

    c1.setMode("offline");
    c2.setMode("offline");

    c1.setUsername(generateRandomString(10));
    c2.setUsername(generateRandomString(10));

    manager.setForward(true);

    c1.setSocket(new WebSocket(fakeURL));
    await mockServer.connected;

    c2.setSocket(new WebSocket(fakeURL));
    await mockServer.connected;

    const socketClientA = c1.getSocket();
    const socketClientB = c2.getSocket();

    manager.setUsers(users);

    socketClientA.send(
      JSON.stringify({
        type: "login",
        name: c1.getUsername(),
        visible: 1,
      }),
    );

    await expect(mockServer).toReceiveMessage(
      JSON.stringify({
        type: "login",
        name: c1.getUsername(),
        visible: 1,
      }),
    );

    socketClientB.send(
      JSON.stringify({
        type: "login",
        name: c2.getUsername(),
        visible: 0,
      }),
    );

    await expect(mockServer).toReceiveMessage(
      JSON.stringify({
        type: "login",
        name: c2.getUsername(),
        visible: 0,
      }),
    );

    let message1 = null;
    let message2 = null;

    socketClientA.onmessage = (e) => {
      message1 = JSON.parse(e.data);
    };

    socketClientB.onmessage = (e) => {
      message2 = JSON.parse(e.data);
    };

    //id,name,estado,mode,socket
    //obj.payload.name,true,obj.payload.mode,obj.connection

    let payloadA = {
      name: c1.getUsername(),
      mode: "hybrid",
      connection: socketClientA,
    };

    let payloadB = {
      name: c2.getUsername(),
      mode: "hybrid",
      connection: socketClientB,
    };

    manager
      .handler()
      .getOperation("login")
      .do(collaborates(mockServer, payloadA, manager));

    expect(message1.type).toEqual("login");
    expect(message1.success).toEqual(true);
    expect(message1.username).toEqual(c1.getUsername());

    manager
      .handler()
      .getOperation("login")
      .do(collaborates(mockServer, payloadB, manager));

    expect(message2.type).toEqual("login");
    expect(message2.success).toEqual(true);
    expect(message2.username).toEqual(c2.getUsername());

    expect(users.getUsers().length).toEqual(2);

    let payloadToUser = {
      type: "touser",
      source: c1.getUsername(),
      source_id: message1.id,
      mode: "hybrid",
      target: c2.getUsername(),
      target_id: message2.id,
      spec: {},
    };

    manager
      .handler()
      .getOperation("touser")
      .do(collaborates(mockServer, payloadToUser, manager));

    expect(message2.type).toEqual("responsebroadcast");
    expect(message2.id).toEqual(message1.id);
    expect(message2.username).toEqual(c1.getUsername());
    expect(message2.mode).toEqual("hybrid");

    // JSON.stringify({
    //   'type': "responsebroadcast",
    //   'id': obj.payload.sourceId,
    //   'username': obj.payload.source,
    //   'mode':obj.payload.mode,
    //   'spec':obj.payload.spec
    // })

    mockServer.close();

    await mockServer.closed;
  });

  test("Test operation login after that run operation listuser support ", async () => {
    const manager = new ServiceWS();

    const mockServer = new WS(fakeURL);

    manager.setWS(mockServer);

    let nextID = Date.now().toString();

    manager.setNextID(nextID);

    const users = new CollectionWS();

    const c1 = new ClientWS();
    const c2 = new ClientWS();

    c1.setMode("offline");
    c2.setMode("offline");

    c1.setUsername(generateRandomString(10));
    c2.setUsername(generateRandomString(10));

    manager.setForward(true);

    c1.setSocket(new WebSocket(fakeURL));
    await mockServer.connected;

    c2.setSocket(new WebSocket(fakeURL));
    await mockServer.connected;

    const socketClientA = c1.getSocket();
    const socketClientB = c2.getSocket();

    manager.setUsers(users);

    socketClientA.send(
      JSON.stringify({
        type: "login",
        name: c1.getUsername(),
        visible: 1,
      }),
    );

    await expect(mockServer).toReceiveMessage(
      JSON.stringify({
        type: "login",
        name: c1.getUsername(),
        visible: 1,
      }),
    );

    socketClientB.send(
      JSON.stringify({
        type: "login",
        name: c2.getUsername(),
        visible: 0,
      }),
    );

    await expect(mockServer).toReceiveMessage(
      JSON.stringify({
        type: "login",
        name: c2.getUsername(),
        visible: 0,
      }),
    );

    let message1 = null;
    let message2 = null;

    socketClientA.onmessage = (e) => {
      message1 = JSON.parse(e.data);
    };

    socketClientB.onmessage = (e) => {
      message2 = JSON.parse(e.data);
    };

    let payloadA = {
      name: c1.getUsername(),
      mode: "hybrid",
      connection: socketClientA,
    };

    let payloadB = {
      name: c2.getUsername(),
      mode: "hybrid",
      connection: socketClientB,
    };

    manager
      .handler()
      .getOperation("login")
      .do(collaborates(mockServer, payloadA, manager));

    expect(message1.type).toEqual("login");
    expect(message1.success).toEqual(true);
    expect(message1.username).toEqual(c1.getUsername());

    manager
      .handler()
      .getOperation("login")
      .do(collaborates(mockServer, payloadB, manager));

    expect(message2.type).toEqual("login");
    expect(message2.success).toEqual(true);
    expect(message2.username).toEqual(c2.getUsername());

    expect(users.getUsers().length).toEqual(2);

    let payloadToUser = {
      type: "listUsers",
      who: c1.getUsername(),
    };

    manager
      .handler()
      .getOperation("listUsers")
      .do(collaborates(mockServer, payloadToUser, manager));

    expect(message1.type).toEqual("listUsers");
    expect(message1.usersonline).toEqual([]);
    expect(message1.status).toEqual(0);

    mockServer.close();

    await mockServer.closed;
  });
});
