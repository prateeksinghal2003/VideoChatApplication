// let connections = {}
// let messages = {}
// let timeOnline = {}

// export const attachSocketHandlers = (io) => {
//     //new client came in
//     io.on("connection", (socket) => {

//         console.log("SOMETHING CONNECTED")

//         //new client joining the existing room or a new room
//         socket.on("join-call", (path) => {
//             let roomKey = path;
//             try {
//                 const url = new URL(path);
//                 roomKey = url.pathname || path;
//             } catch (_) {
//                 // path is not a URL; keep as-is
//             }
//             // normalize trailing slashes
//             if (roomKey.length > 1 && roomKey.endsWith('/')) {
//                 roomKey = roomKey.slice(0, -1);
//             }

//             if (connections[roomKey] === undefined) {
//                 connections[roomKey] = []
//             }
//             connections[roomKey].push(socket.id)

//             timeOnline[socket.id] = new Date();


//         //sending notifications to all clients 
//             for (let a = 0; a < connections[roomKey].length; a++) {
//                 io.to(connections[roomKey][a]).emit("user-joined", socket.id, connections[roomKey])
//             }


//             if (messages[roomKey] !== undefined) {

//                 //loop through previous messages
//                 for (let a = 0; a < messages[roomKey].length; ++a) {
//                     io.to(socket.id).emit("chat-message", messages[roomKey][a]['data'],
//                         messages[roomKey][a]['sender'], messages[roomKey][a]['socket-id-sender'])
//                 }
//             }

//         })

//         socket.on("signal", (toId, message) => {
//             io.to(toId).emit("signal", socket.id, message);
//         })                                                                                                                      

// // reduce is looping over all rooms to find which room contains this socket.
// // It remembers the result in the accumulator [room, isFound].
// // Once found, it stops updating and keeps the correct room.
// // After the loop, you know which room the client belongs to.


//         socket.on("chat-message", (data, sender) => {

//             const [matchingRoom, found] = Object.entries(connections)
//                 .reduce(([room, isFound], [roomKey, roomValue]) => {


//                     if (!isFound && roomValue.includes(socket.id)) {
//                         return [roomKey, true];
//                     }

//                     return [room, isFound];

//                 }, ['', false]);

//             if (found === true) {
//                 if (messages[matchingRoom] === undefined) {
//                     messages[matchingRoom] = []
//                 }

//                 messages[matchingRoom].push({ 'sender': sender, "data": data, "socket-id-sender": socket.id })
//                 console.log("message", matchingRoom, ":", sender, data)

//                 connections[matchingRoom].forEach((elem) => {
//                     io.to(elem).emit("chat-message", data, sender, socket.id)
//                 })
//             }

//         })

//         socket.on("disconnect", () => {

//             var diffTime = Math.abs(timeOnline[socket.id] - new Date())

//             var key

//             for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {

//                 for (let a = 0; a < v.length; ++a) {
//                     if (v[a] === socket.id) {
//                         key = k

//                         for (let a = 0; a < connections[key].length; ++a) {
//                             io.to(connections[key][a]).emit('user-left', socket.id)
//                         }

//                         var index = connections[key].indexOf(socket.id)

//                         connections[key].splice(index, 1)


//                         if (connections[key].length === 0) {
//                             delete connections[key]
//                         }
//                     }
//                 }

//             }


//         })


//     })
// }




import { Server } from "socket.io"


let connections = {}
let messages = {}
let timeOnline = {}

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });


    io.on("connection", (socket) => {

        console.log("SOMETHING CONNECTED")

        socket.on("join-call", (path) => {

            if (connections[path] === undefined) {
                connections[path] = []
            }
            connections[path].push(socket.id)

            timeOnline[socket.id] = new Date();

            // connections[path].forEach(elem => {
            //     io.to(elem)
            // })

            for (let a = 0; a < connections[path].length; a++) {
                io.to(connections[path][a]).emit("user-joined", socket.id, connections[path])
            }

            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; ++a) {
                    io.to(socket.id).emit("chat-message", messages[path][a]['data'],
                        messages[path][a]['sender'], messages[path][a]['socket-id-sender'])
                }
            }

        })

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        })

        socket.on("chat-message", (data, sender) => {

            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {


                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }

                    return [room, isFound];

                }, ['', false]);

            if (found === true) {
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = []
                }

                messages[matchingRoom].push({ 'sender': sender, "data": data, "socket-id-sender": socket.id })
                console.log("message", matchingRoom, ":", sender, data)

                connections[matchingRoom].forEach((elem) => {
                    io.to(elem).emit("chat-message", data, sender, socket.id)
                })
            }

        })

        socket.on("disconnect", () => {

            var diffTime = Math.abs(timeOnline[socket.id] - new Date())

            var key

            for (const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {

                for (let a = 0; a < v.length; ++a) {
                    if (v[a] === socket.id) {
                        key = k

                        for (let a = 0; a < connections[key].length; ++a) {
                            io.to(connections[key][a]).emit('user-left', socket.id)
                        }

                        var index = connections[key].indexOf(socket.id)

                        connections[key].splice(index, 1)


                        if (connections[key].length === 0) {
                            delete connections[key]
                        }
                    }
                }

            }


        })


    })


    return io;
}

