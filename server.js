import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

// Enable CORS for all routes (allows frontend on port 5173 to talk to backend on 3000)
app.use(cors());

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PATCH", "PUT"]
  }
});

const PORT = process.env.PORT || 3001;
const DB_FILE = path.join(__dirname, 'database.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// --- Data Store ---
let data = {
  lists: [],
  items: []
};

// Load data
if (fs.existsSync(DB_FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    console.error("Failed to load database", e);
  }
}

const saveData = () => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  // No longer broadcasting full sync on every save
};

// --- Socket.io ---
io.on('connection', (socket) => {
  console.log('Client connected');
  // Send initial state on connection
  socket.emit('sync', data);

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// --- API Endpoints ---

// Get all data
app.get('/api/data', (req, res) => {
  res.json(data);
});

// Create List
app.post('/api/lists', (req, res) => {
  const newList = req.body;
  data.lists.push(newList);
  saveData();
  // Broadcast specific event
  io.emit('list:created', newList);
  res.json({ success: true });
});

// Delete List
app.delete('/api/lists/:id', (req, res) => {
  const { id } = req.params;
  data.lists = data.lists.filter(l => l.id !== id);
  data.items = data.items.filter(i => i.listId !== id);
  saveData();
  io.emit('list:deleted', id);
  res.json({ success: true });
});

// Add Item
app.post('/api/items', (req, res) => {
  const newItem = req.body;
  // Add to the beginning of the list for that listId
  data.items.unshift(newItem);
  saveData();
  io.emit('item:added', newItem);
  res.json({ success: true });
});

// Toggle Item
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

// Delete Item
app.delete('/api/items/:id', (req, res) => {
  const { id } = req.params;
  data.items = data.items.filter(i => i.id !== id);
  saveData();
  io.emit('item:deleted', id);
  res.json({ success: true });
});

// Reorder Items (Sync list items order)
app.put('/api/lists/:listId/items', (req, res) => {
  const { listId } = req.params;
  const { items: sortedItems } = req.body; // Array of item objects in new order

  // Remove old items for this list
  const otherItems = data.items.filter(i => i.listId !== listId);

  // Combine: other items + new sorted items for this list
  data.items = [...sortedItems, ...otherItems];

  saveData();
  io.emit('list:order_updated', { listId, items: sortedItems });
  res.json({ success: true });
});

// Fallback for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});