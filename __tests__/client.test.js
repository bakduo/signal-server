const { ClientWS, CollectionWS } = require("../src/model/client");

const { WS } = require("jest-websocket-mock");

//const { logger }= require('../src/config/config');

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

describe("Test usuarios", () => {
  test("Test instance ClientWS", () => {
    const client = new ClientWS();
    expect(client).not.toEqual(null);
  });

  test("Test UserRTC", () => {
    const mockServer = new WS(fakeURL);
    const users = new CollectionWS();
    expect(users).not.toEqual(null);

    const c1 = new ClientWS();
    const c2 = new ClientWS();
    const c3 = new ClientWS();

    c1.setId(Date.now().toString());
    c2.setId(Date.now().toString());
    c3.setId(Date.now().toString());
    c1.setMode("offline");
    c2.setMode("offline");
    c3.setMode("offline");

    c1.setUsername(generateRandomString(10));
    c2.setUsername(generateRandomString(10));
    c3.setUsername(generateRandomString(10));

    c1.setSocket(new WebSocket(fakeURL));
    c2.setSocket(new WebSocket(fakeURL));
    c3.setSocket(new WebSocket(fakeURL));

    users.addClientSocket(c1);
    users.addClientSocket(c2);
    users.addClientSocket(c3);

    expect(users.getUsers().length).toEqual(3);

    expect(users.getUserByUsername(c1.getUsername())).toEqual(c1)
    expect(users.getUserByUsername(c2.getUsername())).toEqual(c2)
    expect(users.getUserByUsername(c3.getUsername())).toEqual(c3)

    mockServer.close();
  });

  test("Test payload UserRTC", async () => {
    const mockServer = new WS(fakeURL);
    const c1 = new ClientWS();
    c1.setId(Date.now().toString());
    c1.setMode("online");
    c1.setUsername(generateRandomString(10));
    c1.setSocket(new WebSocket(fakeURL));

    await mockServer.connected;

    c1.getSocket().send(
      JSON.stringify({
        type: "login",
        success: true,
        id: c1.getId(),
        username: c1.getUsername(),
      }),
    );

    await expect(mockServer).toReceiveMessage(
      JSON.stringify({
        type: "login",
        success: true,
        id: c1.getId(),
        username: c1.getUsername(),
      }),
    );
  });
});
