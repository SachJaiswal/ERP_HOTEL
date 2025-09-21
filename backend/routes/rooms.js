const express = require('express');
const { body, validationResult } = require('express-validator');
const Room = require('../models/Room');
const router = express.Router();

// Validation middleware
const validateRoom = [
  body('roomNumber').notEmpty().withMessage('Room number is required'),
  body('roomType').isIn(['Standard', 'Deluxe', 'Suite', 'Executive', 'Presidential']).withMessage('Valid room type is required'),
  body('capacity').isInt({ min: 1, max: 10 }).withMessage('Capacity must be between 1 and 10'),
  body('pricePerNight').isFloat({ min: 0 }).withMessage('Price per night must be a positive number'),
  body('floor').isInt({ min: 1 }).withMessage('Floor must be a positive number')
];

// GET /api/rooms - Get all rooms with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      roomType,
      status,
      floor,
      minPrice,
      maxPrice,
      amenities,
      sortBy = 'roomNumber',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (roomType) filter.roomType = roomType;
    if (status) filter.status = status;
    if (floor) filter.floor = parseInt(floor);
    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = parseFloat(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = parseFloat(maxPrice);
    }
    if (amenities) {
      const amenityArray = amenities.split(',');
      filter.amenities = { $in: amenityArray };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const rooms = await Room.find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Room.countDocuments(filter);

    res.json({
      rooms,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rooms', error: error.message });
  }
});

// GET /api/rooms/:id - Get room by ID
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching room', error: error.message });
  }
});

// POST /api/rooms - Create new room
router.post('/', validateRoom, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const room = new Room(req.body);
    await room.save();

    res.status(201).json(room);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Room number already exists' });
    } else {
      res.status(500).json({ message: 'Error creating room', error: error.message });
    }
  }
});

// PUT /api/rooms/:id - Update room
router.put('/:id', validateRoom, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Room number already exists' });
    } else {
      res.status(500).json({ message: 'Error updating room', error: error.message });
    }
  }
});

// PATCH /api/rooms/:id/status - Update room status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Available', 'Occupied', 'Maintenance', 'Out of Order'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Error updating room status', error: error.message });
  }
});

// DELETE /api/rooms/:id - Delete room
router.delete('/:id', async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting room', error: error.message });
  }
});

// GET /api/rooms/available - Get available rooms for specific dates
router.get('/available', async (req, res) => {
  try {
    const { checkIn, checkOut, roomType, capacity } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({ 
        message: 'Check-in and check-out dates are required' 
      });
    }

    // Build filter for available rooms
    const filter = {
      status: 'Available',
      isActive: true
    };

    if (roomType) filter.roomType = roomType;
    if (capacity) filter.capacity = { $gte: parseInt(capacity) };

    // Find rooms that are not booked during the specified period
    const Reservation = require('../models/Reservation');
    const bookedRooms = await Reservation.find({
      status: { $in: ['Confirmed', 'Checked In'] },
      $or: [
        {
          checkIn: { $lte: new Date(checkOut) },
          checkOut: { $gte: new Date(checkIn) }
        }
      ]
    }).distinct('room');

    filter._id = { $nin: bookedRooms };

    const availableRooms = await Room.find(filter).sort({ roomNumber: 1 });

    res.json(availableRooms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching available rooms', error: error.message });
  }
});

// GET /api/rooms/types - Get room type statistics
router.get('/types', async (req, res) => {
  try {
    const roomTypes = await Room.aggregate([
      {
        $group: {
          _id: '$roomType',
          count: { $sum: 1 },
          averagePrice: { $avg: '$pricePerNight' },
          minPrice: { $min: '$pricePerNight' },
          maxPrice: { $max: '$pricePerNight' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json(roomTypes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching room types', error: error.message });
  }
});

// GET /api/rooms/status - Get room status statistics
router.get('/status', async (req, res) => {
  try {
    const statusStats = await Room.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json(statusStats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching room status', error: error.message });
  }
});

module.exports = router;
