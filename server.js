const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

app.use(express.static(path.join(__dirname, 'public')));

let petSocket = null;
let controllerSocket = null;

io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  socket.on('register', (role) => {
    if (role === 'pet') {
      petSocket = socket;
      console.log('🐱 Pet connected');
      // Tell controller pet is online
      if (controllerSocket) controllerSocket.emit('pet-status', 'online');
    } else if (role === 'controller') {
      controllerSocket = socket;
      console.log('🎮 Controller connected');
      // Tell controller if pet is already connected
      socket.emit('pet-status', petSocket ? 'online' : 'offline');
    }
  });

  socket.on('send-command', (cmd) => {
    console.log('Command from controller:', cmd);
    if (petSocket) {
      petSocket.emit('command', cmd);
    }
  });

  socket.on('disconnect', () => {
    if (socket === petSocket) {
      petSocket = null;
      console.log('🐱 Pet disconnected');
      if (controllerSocket) controllerSocket.emit('pet-status', 'offline');
    }
    if (socket === controllerSocket) {
      controllerSocket = null;
      console.log('🎮 Controller disconnected');
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Desktop Pet relay server running on port ${PORT}`);
  console.log(`🎮 Open controller at: http://localhost:${PORT}\n`);
});