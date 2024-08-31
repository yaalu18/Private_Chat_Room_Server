const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
mongoose.connect('mongodb+srv://yaalu18:admin1@private-chat-room1.4osy13u.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB connected');
})
.catch(err => console.error('MongoDB connection error:', err));

// Define Mongoose schema and model
const chatRoomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  users: [String],
  messages: [{ user: String, text: String, timestamp: { type: Date, default: Date.now } }]
});

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('createRoom', async ({ name }) => {
    try {
      const existingRoom = await ChatRoom.findOne({ name });
      if (existingRoom) {
        socket.emit('createRoomResponse', { success: false, error: 'Room already exists' });
      } else {
        const chatRoom = new ChatRoom({ name, users: [] });
        await chatRoom.save();
        socket.emit('createRoomResponse', { success: true, data: chatRoom });
      }
    } catch (err) {
      console.error('Error creating room:', err);
      socket.emit('createRoomResponse', { success: false, error: 'Internal Server Error' });
    }
  });

  // Handle other events and disconnections as before
});

// Socket.io events
/*io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinRoom', async ({ room, user }) => {
    try {
      socket.join(room);

      // Update room users
      await ChatRoom.updateOne({ name: room }, { $addToSet: { users: user } });

      // Notify room about the new user
      socket.to(room).emit('message', { user: 'System', text: `${user} has joined the room!` });

      // Listen for incoming messages
      socket.on('message', async (message) => {
        try {
          const chatRoom = await ChatRoom.findOne({ name: room });
          if (!chatRoom) {
            return socket.emit('message', { user: 'System', text: 'Room does not exist' });
          }

          chatRoom.messages.push({ user: message.user, text: message.text, timestamp: new Date() });
          await chatRoom.save();
          io.to(room).emit('message', message);
        } catch (err) {
          console.error('Error handling message:', err);
        }
      });

      // Handle user disconnection
      socket.on('disconnect', async () => {
        try {
          console.log('A user disconnected');
          await ChatRoom.updateOne({ name: room }, { $pull: { users: user } });
          socket.to(room).emit('message', { user: 'System', text: `${user} has left the room.` });

          const chatRoom = await ChatRoom.findOne({ name: room });
          if (chatRoom && chatRoom.users.length === 0) {
            await ChatRoom.deleteOne({ name: room });
          }
        } catch (err) {
          console.error('Error handling disconnection:', err);
        }
      });

    } catch (err) {
      console.error('Error joining room:', err);
    }
  });
});*/

// Routes
app.get('/', (req, res) => {
  res.send('Hello World');
});

app.post('/createRoom', async (req, res) => {
  try {
    const { name } = req.body;
    const existingRoom = await ChatRoom.findOne({ name });
    if (existingRoom) {
      return res.status(400).json({ error: 'Room already exists' });
    }
    const chatRoom = new ChatRoom({ name, users: [] });
    await chatRoom.save();
    res.status(201).json(chatRoom);
  } catch (err) {
    console.error('Error creating room:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Server setup
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
