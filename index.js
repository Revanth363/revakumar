const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.static('public'));

// In-memory message storage
let messages = [];

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Send existing messages to the new user
  socket.emit('initialMessages', messages);

  // Handle new message
  socket.on('sendMessage', (message) => {
    messages.push(message);
    io.emit('newMessage', message); // Broadcast to all clients
  });

  // Handle message deletion (for the user only)
  socket.on('deleteMessage', (messageId) => {
    socket.emit('messageDeleted', messageId); // Notify only the user
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});