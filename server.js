const express = require('express');
const app = express();
const server = require('http').Server(app);
const { v4: uuidV4 } = require('uuid');
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true
});

app.use('/peerjs', peerServer);

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.redirect(`/${uuidV4()}`);
});

app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room });
});

let tasks = [];

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', userId);
        socket.emit('update-tasks', tasks);
        
        socket.on('message', (message) => {
            io.to(roomId).emit('createMessage', message)
        }); 
        
        socket.on('file-message', file => {
            io.to(roomId).emit('fileMessage', file);
        });

        socket.on('new-task', taskText => {
            const task = { text: taskText, completed: false };
            tasks.push(task);
            io.to(roomId).emit('add-task', taskText);
            io.to(roomId).emit('update-tasks', tasks);
        });

        socket.on('delete-task', taskText => {
            tasks = tasks.filter(task => task.text !== taskText);
            io.to(roomId).emit('update-tasks', tasks);
        });

        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', userId);
        });
    });
});

server.listen(process.env.PORT || 3030);
