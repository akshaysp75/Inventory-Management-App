const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const User = require('./models/User'); // User schema with password hashing
const InventoryItem = require('./models/InventoryItem'); // Your inventory model

const app = express();
const PORT = 5000;
const JWT_SECRET = 'your_jwt_secret_key'; // In production, use process.env.JWT_SECRET

// CORS configuration (no trailing slash)
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(
  'mongodb+srv://akshay_75:Akshay%4075@cluster0.xjc3k.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
)
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ======================= AUTH ROUTES =======================

// Signup
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password are required' });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ success: false, message: 'User already exists' });

    const newUser = new User({ email, password });
    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ success: true, token });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'Signup failed due to server error.' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Email and password are required' });

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ success: true, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed due to server error.' });
  }
});

// ======================= TOKEN VERIFICATION ROUTE =======================
app.post('/api/verify-token', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ success: true, user: decoded });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
});

// ======================= PROTECTED INVENTORY ROUTES =======================

// Get all inventory items
app.get('/api/inventory', authenticate, async (req, res) => {
  try {
    const items = await InventoryItem.find();
    res.json(items);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Error fetching inventory' });
  }
});

// Add new inventory item
app.post('/api/inventory/add', authenticate, async (req, res) => {
  const { name, quantity, price, category } = req.body;
  try {
    const newItem = new InventoryItem({ name, quantity, price, category });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Add error:', error);
    res.status(500).json({ error: 'Error adding item' });
  }
});

// Get a single inventory item by ID
app.get('/api/inventory/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  try {
    const item = await InventoryItem.findById(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Fetch single item error:', error);
    res.status(500).json({ error: 'Error fetching item' });
  }
}); 

// Update Inventory 

// Update inventory item by ID
app.put('/api/inventory/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { name, quantity, price, category } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  try {
    const updatedItem = await InventoryItem.findByIdAndUpdate(
      id,
      { name, quantity, price, category },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(updatedItem);
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ error: 'Error updating item' });
  }
});



// Delete inventory item
app.delete('/api/inventory/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    await InventoryItem.findByIdAndDelete(id);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Error deleting item' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
