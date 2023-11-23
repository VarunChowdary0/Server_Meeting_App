const express = require("express");
const http = require("http");
const cors = require("cors");
const {Server} = require("socket.io");

const app = express(); 
app.use(cors());

const server =http.createServer(app);;

const io = new Server(server, {
	cors: {
		origin: "*",
		methods: [ "GET", "POST" ]
	}
});


const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
	res.status(200).json({message:'Connection successful !!'});
});

const users = {};

const socketToRoom = {};

io.on("connection", (socket) => {
    console.log(`USER WITH SOCKED ID : ${socket.id} CONNECTED -------- USER CONNECTION `)

    socket.emit('My_ID',socket.id)

    socket.on("_join_room_", roomID => {
        if (users[roomID]) {
            const length = users[roomID].length;
            if (length === 10) {
                socket.emit("room full");
                return;
            }
            users[roomID].push(socket.id);
        } else {
            users[roomID] = [socket.id];
        }
        socketToRoom[socket.id] = roomID;
        const usersInThisRoom = users[roomID].filter(id => id !== socket.id);

        socket.emit("get_all_users", usersInThisRoom);
    });

    socket.on("sending_signal", payload => {
        io.to(payload.userToSignal).emit('_user_joined_', { signal: payload.signal, callerID: payload.callerID });
    });

    socket.on("returing_signal", payload => {
        io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
    });


    socket.on('joinMeet',(data)=>{
        socket.join(data.meetingID);
        console.log(data);
        console.log(`${data.name} joined meeting ${data.meetingID}`)
    })
    socket.on('Respond',(data)=>{
        console.log(`${socket.id} said "${data.msg}"`)
    })
    socket.on('Page_Status',(data)=>{
        console.log(`user ${data.name} is on ${data.page}`);
    })
    socket.on('send_message',(data)=>{
        socket.join(data.meetingID);
        console.log(`${data.name} says : ${data.message} \n in meeting : ${data.meetingID}`)
        socket.to(data.meetingID).emit('Recive_msg',data);
    })
	socket.on("disconnect", () => {
        console.log(`USER WITH SOCKED ID : ${socket.id} DISCONNECTED -------- USER DISCONNECTION `);
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        if (room) {
            room = room.filter(id => id !== socket.id);
            users[roomID] = room;
        }
    });
});




server.listen(PORT, () => console.log(`Server is running on port ${PORT}......`));