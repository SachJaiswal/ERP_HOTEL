const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Reservation = require('../models/Reservation');
const router = express.Router();

// Validation middleware for creating bookings
const validateBooking = [
  body('reservation').isMongoId().withMessage('Valid reservation ID is required'),
  body('serviceType').notEmpty().withMessage('Service type is required'),
  body('serviceName').notEmpty().withMessage('Service name is required'),
  body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required'),
  body('scheduledTime').notEmpty().withMessage('Scheduled time is required'),
  body('duration').isInt({ min: 15 }).withMessage('Duration must be at least 15 minutes'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

// Validation middleware for updating bookings (without reservation field)
const validateBookingUpdate = [
  body('serviceType').notEmpty().withMessage('Service type is required'),
  body('serviceName').notEmpty().withMessage('Service name is required'),
  body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required'),
  body('scheduledTime').notEmpty().withMessage('Scheduled time is required'),
  body('duration').isInt({ min: 15 }).withMessage('Duration must be at least 15 minutes'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
];

// GET /api/bookings - Get all bookings with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      serviceType,
      scheduledDate,
      reservation,
      assignedStaff,
      sortBy = 'scheduledDate',
      sortOrder = 'asc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (serviceType) filter.serviceType = serviceType;
    if (reservation) filter.reservation = reservation;
    if (assignedStaff) filter.assignedStaff = assignedStaff;
    if (scheduledDate) {
      const date = new Date(scheduledDate);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.scheduledDate = { $gte: date, $lt: nextDay };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const bookings = await Booking.find(filter)
      .populate('reservation', 'reservationNumber guest checkIn checkOut')
      .populate('assignedStaff', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Booking.countDocuments(filter);

    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
});

// GET /api/bookings/:id - Get booking by ID
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('reservation')
      .populate('assignedStaff', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching booking', error: error.message });
  }
});

// POST /api/bookings - Create new booking
router.post('/', validateBooking, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reservation } = req.body;

    // Verify reservation exists
    const reservationData = await Reservation.findById(reservation);
    if (!reservationData) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Check if reservation is in a valid state for booking
    if (!['Confirmed', 'Checked In'].includes(reservationData.status)) {
      return res.status(400).json({ 
        message: 'Cannot create booking for reservation with status: ' + reservationData.status 
      });
    }

    const booking = new Booking(req.body);
    await booking.save();

    // Populate the reservation data in response
    await booking.populate('reservation', 'reservationNumber guest checkIn checkOut');

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  }
});

// PUT /api/bookings/:id - Update booking
router.put('/:id', validateBookingUpdate, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('reservation', 'reservationNumber guest checkIn checkOut');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking', error: error.message });
  }
});

// PATCH /api/bookings/:id/status - Update booking status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('reservation', 'reservationNumber guest checkIn checkOut');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking status', error: error.message });
  }
});

// PATCH /api/bookings/:id/assign - Assign staff to booking
router.patch('/:id/assign', async (req, res) => {
  try {
    const { assignedStaff } = req.body;

    if (!assignedStaff) {
      return res.status(400).json({ message: 'Staff ID is required' });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { assignedStaff },
      { new: true }
    ).populate('assignedStaff', 'firstName lastName email phone');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error assigning staff', error: error.message });
  }
});

// DELETE /api/bookings/:id - Delete booking
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting booking', error: error.message });
  }
});

// GET /api/bookings/reservation/:reservationId - Get all bookings for a reservation
router.get('/reservation/:reservationId', async (req, res) => {
  try {
    const bookings = await Booking.find({ reservation: req.params.reservationId })
      .populate('assignedStaff', 'firstName lastName email phone')
      .populate('createdBy', 'firstName lastName email')
      .sort({ scheduledDate: 1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings for reservation', error: error.message });
  }
});

// GET /api/bookings/staff/:staffId - Get all bookings assigned to a staff member
router.get('/staff/:staffId', async (req, res) => {
  try {
    const { date } = req.query;
    
    const filter = { assignedStaff: req.params.staffId };
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      filter.scheduledDate = { $gte: startDate, $lt: endDate };
    }

    const bookings = await Booking.find(filter)
      .populate('reservation', 'reservationNumber guest checkIn checkOut')
      .sort({ scheduledDate: 1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching staff bookings', error: error.message });
  }
});

module.exports = router;
