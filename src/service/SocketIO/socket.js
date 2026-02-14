import { Server } from "socket.io";
import cors from 'cors';


export const initSocket = (server) => {

    const io = new Server(server, { cors: { origin: "*" }  });

    io.on("connection", (socket) => {


        console.log("A user connected:", socket.id);

        socket.on("join", (userId) => {socket.join(userId);
            console.log(`User ${userId} joined their private room`); 
        });

        socket.on("disconnect", () => { console.log("User disconnected");});
    });

    return io;
};