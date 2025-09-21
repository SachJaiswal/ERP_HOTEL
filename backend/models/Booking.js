const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingNumber: {
    type: String,
    required: true,
    unique: true
  },
  reservation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    required: true
  },
  serviceType: {
    type: String,
    required: true,
    enum: ['Room Service', 'Spa', 'Restaurant', 'Conference Room', 'Event Hall', 'Transportation', 'Tour', 'Other']
  },
  serviceName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 1000
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 15
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show'],
    default: 'Scheduled'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Partially Paid', 'Refunded'],
    default: 'Pending'
  },
  assignedStaff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  specialInstructions: {
    type: String,
    maxlength: 1000
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries
bookingSchema.index({ bookingNumber: 1 });
bookingSchema.index({ reservation: 1 });
bookingSchema.index({ serviceType: 1 });
bookingSchema.index({ scheduledDate: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ assignedStaff: 1 });

// Pre-save middleware to generate booking number
bookingSchema.pre('save', async function(next) {
  if (this.isNew && !this.bookingNumber) {
    const count = await this.constructor.countDocuments();
    this.bookingNumber = `BK${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Pre-save middleware to calculate total amount
bookingSchema.pre('save', function(next) {
  if (this.price && this.quantity) {
    this.totalAmount = this.price * this.quantity;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
