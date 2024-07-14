import { Socket, Server as SocketIOServer } from 'socket.io';

import { UserManager } from './UserManager';
import { createServer } from 'https';
import next from 'next';
import { parse } from 'url';
import { readFileSync } from 'fs';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const userManager = new UserManager();

const httpsOptions = {
  key: readFileSync('./key.pem'),
  cert: readFileSync('./cert.pem')
};

app.prepare().then(() => {
  const server = createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log('a user connected', socket.handshake.query['name']);
    userManager.addUser(socket.handshake.query['name'] as string, socket);
    socket.on('disconnect', () => {
      console.log('user disconnected');
      userManager.removeUser(socket.id);
    });
    socket.on('close', () => {
      console.log('user disconnected');
      userManager.removeUser(socket.id);
    });
    socket.on('leave', () => {
      userManager.userLeft(socket.id);
    });
  });

  server.listen(3000, (err?: any) => {
    if (err) throw err;
    console.log('> Ready on https://localhost:3000');
  });
});