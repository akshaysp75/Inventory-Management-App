const express = require('express');
const mongoose = require('mongoose');
const InventoryItem = require('../models/InventoryItem');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Get all inventory items
router.get('/', authenticate, async (req, res) => {
  try {
    const items = await InventoryItem.find();
    res.json(items);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Error fetching inventory' });
  }
});

// Add new inventory item
router.post('/add', authenticate, async (req, res) => {
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
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

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

// Update inventory item by ID
router.put('/:id', authenticate, async (req, res) => {
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
router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  try {
    const deletedItem = await InventoryItem.findByIdAndDelete(id);
    if (!deletedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Error deleting item' });
  }
});

module.exports = router;
