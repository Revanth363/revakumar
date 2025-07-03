const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: '*', // allow all during development
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.static('public'));

// In-memory storage
let messages = [];
let onlineUsers = 0;

io.on('connection', (socket) => {
  onlineUsers++;
  console.log(`User connected: ${socket.id}`);
  io.emit('userCount', onlineUsers); // Send updated count
  socket.emit('initialMessages', messages); // Send old messages

  // On joining, save username and broadcast system message
  socket.on('join', (username) => {
    socket.username = username;

    const joinMsg = {
      id: Date.now().toString() + "_join",
      text: `🟢 ${username} joined the chat`,
      sender: "System",
      timestamp: Date.now(),
      isSystem: true,
    };

    messages.push(joinMsg);
    io.emit('newMessage', joinMsg);
  });

  socket.on('sendMessage', (message) => {
    messages.push(message);
    io.emit('newMessage', message);
  });

  socket.on('deleteMessage', (messageId) => {
    socket.emit('messageDeleted', messageId);
  });

  socket.on('disconnect', () => {
    onlineUsers--;
    io.emit('userCount', onlineUsers);

    const leaveMsg = {
      id: Date.now().toString() + "_leave",
      text: `🔴 ${socket.username || "A user"} left the chat`,
      sender: "System",
      timestamp: Date.now(),
      isSystem: true,
    };

    messages.push(leaveMsg);
    io.emit('newMessage', leaveMsg);

    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
