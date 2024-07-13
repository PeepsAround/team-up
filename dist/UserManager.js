"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserManager = void 0;
const Room_1 = require("./Room");
class UserManager {
    constructor() {
        this.users = [];
        this.queue = [];
        this.roomManager = new Room_1.RoomManager();
    }
    addUser(name, socket) {
        this.users.push({
            name, socket
        });
        this.queue.push(socket.id);
        socket.emit("lobby");
        this.clearQueue();
        this.initHandlers(socket);
    }
    removeUser(socketId) {
        const user = this.users.find(x => x.socket.id === socketId);
        if (user) {
            const receivingUser = this.roomManager.userLeft(user);
            if (receivingUser) {
                this.queue.push(receivingUser.socket.id);
            }
            this.clearQueue();
        }
        this.users = this.users.filter(x => x.socket.id !== socketId);
        this.queue = this.queue.filter(x => x !== socketId);
    }
    userLeft(socketId) {
        const user = this.users.find(x => x.socket.id === socketId);
        if (user) {
            const receivingUser = this.roomManager.userLeft(user);
            this.queue.push(socketId);
            if (receivingUser) {
                this.queue.push(receivingUser.socket.id);
            }
            this.clearQueue();
        }
    }
    clearQueue() {
        console.log("inside clear queues");
        console.log(this.queue.length);
        if (this.queue.length < 2) {
            return;
        }
        const id1 = this.queue.shift();
        const id2 = this.queue.pop();
        console.log("id is " + id1 + " " + id2);
        const user1 = this.users.find(x => x.socket.id === id1);
        const user2 = this.users.find(x => x.socket.id === id2);
        if (!user1 || !user2) {
            return;
        }
        console.log("creating roonm");
        const room = this.roomManager.createRoom(user1, user2);
        // this may be redundant if clearQueue is also called after a user exits the room 
        this.clearQueue();
    }
    initHandlers(socket) {
        /*
        1. Server sends event "send-offer" to user1 with roomId
        2. user1 sends event "offer" to server with sdp and roomId
        3. server receives the event "offer" and calls onOffer
        */
        socket.on("offer", ({ sdp, roomId }) => {
            this.roomManager.onOffer(roomId, sdp, socket.id);
        });
        /*
        1. Server sends event "offer" to user2 with sdp of user1 and roomId
        2. user2 sends event "answer" to server with it's sdp and roomId
        3. server receives the event "answer" and calls onAnswer
        */
        socket.on("answer", ({ sdp, roomId }) => {
            this.roomManager.onAnswer(roomId, sdp, socket.id);
        });
        socket.on("add-ice-candidate", ({ candidate, roomId, type }) => {
            this.roomManager.onIceCandidates(roomId, socket.id, candidate, type);
        });
    }
}
exports.UserManager = UserManager;
