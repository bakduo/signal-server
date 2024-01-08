
const {ClientWS, UsersRTC} = require('../src/model/usuarios');

const { Server } = require('mock-socket');

const { logger }= require('../src/config/config');

const generateRandomString = (myLength) => {
    const chars =
      "AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz1234567890";
    const randomArray = Array.from(
      { length: myLength },
      (v, k) => chars[Math.floor(Math.random() * chars.length)]
    );
  
    const randomString = randomArray.join("");
    return randomString;
};

const fakeURL = 'ws://localhost:8080';

const mockServer = new Server(fakeURL);

describe('Test usuarios',() => {
  
    test('Test instance ClientWS',()=> {
      const client =new ClientWS();
      expect(client).not.toEqual(null);
    });

    test('Test UserRTC',()=> {

        const users =new UsersRTC();

        expect(users).not.toEqual(null);

        const c1 =new ClientWS();
        const c2 =new ClientWS();
        const c3 =new ClientWS();

        c1.setId(Date.now().toString());
        c2.setId(Date.now().toString());
        c3.setId(Date.now().toString());
        c1.setMode("offline");
        c2.setMode("offline");
        c3.setMode("offline");
        c1.setUsername(generateRandomString(10));
        c2.setUsername(generateRandomString(10));
        c3.setUsername(generateRandomString(10));

        const fakeURL = 'ws://localhost:8080';
        c1.setSocket(new WebSocket(fakeURL));
        c2.setSocket(new WebSocket(fakeURL));
        c3.setSocket(new WebSocket(fakeURL));

        users.addClient(c1);
        users.addClient(c2);
        users.addClient(c3);

        expect(users.getUsers().length).toEqual(3);

        mockServer.on('connection', socket => {
            socket.on('message', data => { 
                socket.send('test message from mock server');
            });
        });
    
      });
  
  });
  
  