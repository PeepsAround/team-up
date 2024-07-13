"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
let GLOBAL_ROOM_ID = 1;
class RoomManager {
    constructor() {
        this.rooms = new Map();
    }
    createRoom(user1, user2) {
        const roomId = this.generate().toString();
        this.rooms.set(roomId.toString(), {
            user1,
            user2,
        });
        //server is sending event "send-offer" to user1, in return the user1 will send sdp
        user1.socket.emit("send-offer", {
            roomId
        });
        //this may be redundant
        user2.socket.emit("send-offer", {
            roomId
        });
    }
    onOffer(roomId, sdp, senderSocketid) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        const [sendingUser, receivingUser] = room.user1.socket.id === senderSocketid ? [room.user1, room.user2] : [room.user2, room.user1];
        // Server sends an event "offer" to user2 with sdp of user1 and roomId
        receivingUser === null || receivingUser === void 0 ? void 0 : receivingUser.socket.emit("offer", {
            sdp,
            roomId,
            partnerName: sendingUser.name
        });
    }
    onAnswer(roomId, sdp, senderSocketid) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        const receivingUser = room.user1.socket.id === senderSocketid ? room.user2 : room.user1;
        // Server sends an event "offer" to user1 with sdp of user2 and roomId
        receivingUser === null || receivingUser === void 0 ? void 0 : receivingUser.socket.emit("answer", {
            sdp,
            roomId
        });
    }
    onIceCandidates(roomId, senderSocketid, candidate, type) {
        const room = this.rooms.get(roomId);
        if (!room) {
            return;
        }
        const receivingUser = room.user1.socket.id === senderSocketid ? room.user2 : room.user1;
        receivingUser.socket.emit("add-ice-candidate", ({ candidate, type }));
    }
    userLeft(user) {
        var roomId = null;
        for (let [key, value] of this.rooms.entries()) {
            if (value.user1 === user || value.user2 === user) {
                roomId = key;
            }
        }
        if (roomId) {
            const room = this.rooms.get(roomId);
            if (room) {
                const receivingUser = room.user1 === user ? room.user2 : room.user1;
                receivingUser.socket.emit("leave");
                this.rooms.delete(roomId);
                return receivingUser;
            }
        }
        return null;
    }
    generate() {
        return GLOBAL_ROOM_ID++;
    }
}
exports.RoomManager = RoomManager;
