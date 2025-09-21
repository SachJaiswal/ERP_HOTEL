const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  reservationNumber: {
    type: String,
    required: true,
    unique: true
  },
  guest: {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    idType: {
      type: String,
      enum: ['Passport', 'Driver License', 'National ID', 'Other']
    },
    idNumber: String
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  checkIn: {
    type: Date,
    required: true
  },
  checkOut: {
    type: Date,
    required: true
  },
  numberOfGuests: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  numberOfNights: {
    type: Number,
    required: true,
    min: 1
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Checked In', 'Checked Out', 'Cancelled', 'No Show'],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Partially Paid', 'Refunded'],
    default: 'Pending'
  },
  paymentMethod: {
    type: String,
    enum: ['Credit Card', 'Debit Card', 'Cash', 'Bank Transfer', 'Online Payment']
  },
  specialRequests: {
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
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries
reservationSchema.index({ reservationNumber: 1 });
reservationSchema.index({ 'guest.email': 1 });
reservationSchema.index({ checkIn: 1, checkOut: 1 });
reservationSchema.index({ status: 1 });
reservationSchema.index({ room: 1 });

// Virtual for guest full name
reservationSchema.virtual('guest.fullName').get(function() {
  return `${this.guest.firstName} ${this.guest.lastName}`;
});

// Pre-save middleware to generate reservation number
reservationSchema.pre('save', async function(next) {
  if (this.isNew && !this.reservationNumber) {
    const count = await this.constructor.countDocuments();
    this.reservationNumber = `RES${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Pre-save middleware to calculate number of nights and total amount
reservationSchema.pre('save', async function(next) {
  if (this.checkIn && this.checkOut) {
    const timeDiff = this.checkOut.getTime() - this.checkIn.getTime();
    this.numberOfNights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (this.room && this.numberOfNights) {
      const Room = mongoose.model('Room');
      const room = await Room.findById(this.room);
      if (room) {
        this.totalAmount = room.pricePerNight * this.numberOfNights;
      }
    }
  }
  next();
});

module.exports = mongoose.model('Reservation', reservationSchema);
