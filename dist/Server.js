"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const UserManager_1 = require("./UserManager");
const http_1 = require("http");
const next_1 = __importDefault(require("next"));
const url_1 = require("url");
const dev = process.env.NODE_ENV !== 'production';
const app = (0, next_1.default)({ dev });
const handle = app.getRequestHandler();
const userManager = new UserManager_1.UserManager();
app.prepare().then(() => {
    const server = (0, http_1.createServer)((req, res) => {
        const parsedUrl = (0, url_1.parse)(req.url, true);
        handle(req, res, parsedUrl);
    });
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: '*',
        },
    });
    io.on('connection', (socket) => {
        console.log('a user connected', socket.handshake.query['name']);
        userManager.addUser(socket.handshake.query['name'], socket);
        socket.on('disconnect', () => {
            console.log('user disconnected');
            userManager.removeUser(socket.id);
        });
        socket.on('close', () => {
            console.log('user disconnected');
            userManager.removeUser(socket.id);
        });
        socket.on('leave', () => {
            // remove room
            userManager.userLeft(socket.id);
        });
    });
    server.listen(3000, (err) => {
        if (err)
            throw err;
        console.log('> Ready on http://localhost:3000');
    });
});
