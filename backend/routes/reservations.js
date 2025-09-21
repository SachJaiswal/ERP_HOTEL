const express = require('express');
const { body, validationResult } = require('express-validator');
const Reservation = require('../models/Reservation');
const Room = require('../models/Room');
const router = express.Router();

// Validation middleware
const validateReservation = [
  body('guest.firstName').notEmpty().withMessage('First name is required'),
  body('guest.lastName').notEmpty().withMessage('Last name is required'),
  body('guest.email').isEmail().withMessage('Valid email is required'),
  body('guest.phone').notEmpty().withMessage('Phone number is required'),
  body('room').isMongoId().withMessage('Valid room ID is required'),
  body('checkIn').isISO8601().withMessage('Valid check-in date is required'),
  body('checkOut').isISO8601().withMessage('Valid check-out date is required'),
  body('numberOfGuests').isInt({ min: 1, max: 10 }).withMessage('Number of guests must be between 1 and 10')
];

// GET /api/reservations - Get all reservations with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      roomType,
      checkIn,
      checkOut,
      guestEmail,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (guestEmail) filter['guest.email'] = new RegExp(guestEmail, 'i');
    if (checkIn) filter.checkIn = { $gte: new Date(checkIn) };
    if (checkOut) filter.checkOut = { $lte: new Date(checkOut) };

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const reservations = await Reservation.find(filter)
      .populate('room', 'roomNumber roomType pricePerNight')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Reservation.countDocuments(filter);

    res.json({
      reservations,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reservations', error: error.message });
  }
});

// GET /api/reservations/:id - Get reservation by ID
router.get('/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('room')
      .populate('createdBy', 'firstName lastName email')
      .populate('lastModifiedBy', 'firstName lastName email');

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reservation', error: error.message });
  }
});

// POST /api/reservations - Create new reservation
router.post('/', validateReservation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { room, checkIn, checkOut } = req.body;

    // Check if room is available for the given dates
    const existingReservation = await Reservation.findOne({
      room,
      status: { $in: ['Confirmed', 'Checked In'] },
      $or: [
        {
          checkIn: { $lte: new Date(checkOut) },
          checkOut: { $gte: new Date(checkIn) }
        }
      ]
    });

    if (existingReservation) {
      return res.status(400).json({ 
        message: 'Room is not available for the selected dates' 
      });
    }

    // Verify room exists and is available
    const roomData = await Room.findById(room);
    if (!roomData) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (roomData.status !== 'Available') {
      return res.status(400).json({ message: 'Room is not available' });
    }

    const reservation = new Reservation(req.body);
    await reservation.save();

    // Populate the room data in response
    await reservation.populate('room', 'roomNumber roomType pricePerNight');

    res.status(201).json(reservation);
  } catch (error) {
    res.status(500).json({ message: 'Error creating reservation', error: error.message });
  }
});

// PUT /api/reservations/:id - Update reservation
router.put('/:id', validateReservation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { room, checkIn, checkOut } = req.body;

    // Check if room is available for the given dates (excluding current reservation)
    const existingReservation = await Reservation.findOne({
      _id: { $ne: req.params.id },
      room,
      status: { $in: ['Confirmed', 'Checked In'] },
      $or: [
        {
          checkIn: { $lte: new Date(checkOut) },
          checkOut: { $gte: new Date(checkIn) }
        }
      ]
    });

    if (existingReservation) {
      return res.status(400).json({ 
        message: 'Room is not available for the selected dates' 
      });
    }

    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('room', 'roomNumber roomType pricePerNight');

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: 'Error updating reservation', error: error.message });
  }
});

// PATCH /api/reservations/:id/status - Update reservation status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Checked In', 'Checked Out', 'Cancelled', 'No Show'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('room', 'roomNumber roomType pricePerNight');

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: 'Error updating reservation status', error: error.message });
  }
});

// DELETE /api/reservations/:id - Delete reservation
router.delete('/:id', async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndDelete(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.json({ message: 'Reservation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting reservation', error: error.message });
  }
});

// GET /api/reservations/availability/check - Check room availability
router.get('/availability/check', async (req, res) => {
  try {
    const { room, checkIn, checkOut } = req.query;

    if (!room || !checkIn || !checkOut) {
      return res.status(400).json({ 
        message: 'Room ID, check-in date, and check-out date are required' 
      });
    }

    const existingReservation = await Reservation.findOne({
      room,
      status: { $in: ['Confirmed', 'Checked In'] },
      $or: [
        {
          checkIn: { $lte: new Date(checkOut) },
          checkOut: { $gte: new Date(checkIn) }
        }
      ]
    });

    const isAvailable = !existingReservation;

    res.json({ 
      available: isAvailable,
      conflictingReservation: existingReservation ? existingReservation.reservationNumber : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking availability', error: error.message });
  }
});

module.exports = router;
