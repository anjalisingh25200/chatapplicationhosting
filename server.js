const express = require('express')
const app = express();
const bodyParser = require('body-parser');
const { formatMessage, generateLocationMessage } = require('./public/use/message.js');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./public/use/user.js');
const http = require('http').createServer(app)
const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
    console.log(`listening on port${PORT}`)
})


//set static folder i.e 'public'
app.use(express.static(__dirname + '/public'))


const botname = 'whatapp bot'

//Socket
const io = require('socket.io')(http)
io.on('connection', (socket) => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);
        // console.log(' Web socket connected.....')
        //for welcome current user
        socket.emit('message', formatMessage(botname, 'Welcome to whatapp chat app!'))

        //Broadcast when user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(botname, `${user.username} has joined the chat`));
        //send user and room information
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })

        //listen for chatMessage
        socket.on('chatMessage', msg => {
            const user = getCurrentUser(socket.id);
            io.to(user.room).emit('message', formatMessage(user.username, msg));
        })
        socket.on('sendLocation', (coords) => {
            io.emit('locationmessage',
                generateLocationMessage(`${user.username}`, `${coords.latitude}`, `${coords.longitude}`))
        })

        //Run when client disconnects

        socket.on('disconnect', () => {
            //user leave the chat
            const user = userLeave(socket.id);
            if (user) {
                io.to(user.room).emit('message', formatMessage(botname, `${user.username} has left the chat`));
                //send user and room information
                io.to(user.room).emit('roomUsers', {
                    room: user.room,
                    users: getRoomUsers(user.room)
                })

            }

        })

    })





})
