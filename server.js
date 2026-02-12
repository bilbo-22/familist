import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ALLOWED_METHODS = ["GET", "POST", "DELETE", "PATCH", "PUT"];

const app = express();
const httpServer = createServer(app);

// Enable CORS for all routes (allows frontend on port 5173 to talk to backend on 3000)
app.use(cors());

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ALLOWED_METHODS
  }
});

const PORT = process.env.PORT || 3001;
const DB_FILE = path.join(__dirname, 'database.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

let data = {
  lists: [],
  items: []
};

if (fs.existsSync(DB_FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    console.error("Failed to load database", e);
  }
}

const saveData = () => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

function removeListAndItems(listId) {
  data.lists = data.lists.filter(l => l.id !== listId);
  data.items = data.items.filter(i => i.listId !== listId);
}

function reorderListItems(listId, sortedItems) {
  const otherItems = data.items.filter(i => i.listId !== listId);
  data.items = [...sortedItems, ...otherItems];
}

io.on('connection', (socket) => {
  console.log('Client connected');
  socket.emit('sync', data);

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

app.get('/api/data', (req, res) => {
  res.json(data);
});

app.post('/api/lists', (req, res) => {
  const newList = req.body;
  data.lists.push(newList);
  saveData();
  // Broadcast specific event
  io.emit('list:created', newList);
  res.json({ success: true });
});

app.delete('/api/lists/:id', (req, res) => {
  const { id } = req.params;
  removeListAndItems(id);
  saveData();
  io.emit('list:deleted', id);
  res.json({ success: true });
});

app.post('/api/items', (req, res) => {
  const newItem = req.body;
  data.items.unshift(newItem);
  saveData();
  io.emit('item:added', newItem);
  res.json({ success: true });
});

app.patch('/api/items/:id', (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  const item = data.items.find(i => i.id === id);
  if (item) {
    item.completed = completed;
    saveData();
    io.emit('item:updated', item);
  }
  res.json({ success: true });
});

app.delete('/api/items/:id', (req, res) => {
  const { id } = req.params;
  data.items = data.items.filter(i => i.id !== id);
  saveData();
  io.emit('item:deleted', id);
  res.json({ success: true });
});

app.put('/api/lists/:listId/items', (req, res) => {
  const { listId } = req.params;
  const { items: sortedItems } = req.body;
  reorderListItems(listId, sortedItems);

  saveData();
  io.emit('list:order_updated', { listId, items: sortedItems });
  res.json({ success: true });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
