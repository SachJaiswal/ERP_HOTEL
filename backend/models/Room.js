const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  roomType: {
    type: String,
    required: true,
    enum: ['Standard', 'Deluxe', 'Suite', 'Executive', 'Presidential']
  },
  capacity: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  pricePerNight: {
    type: Number,
    required: true,
    min: 0
  },
  amenities: [{
    type: String,
    enum: ['WiFi', 'TV', 'Mini Bar', 'Balcony', 'Ocean View', 'City View', 'Air Conditioning', 'Room Service', 'Safe', 'Jacuzzi']
  }],
  status: {
    type: String,
    enum: ['Available', 'Occupied', 'Maintenance', 'Out of Order'],
    default: 'Available'
  },
  floor: {
    type: Number,
    required: true,
    min: 1
  },
  description: {
    type: String,
    maxlength: 500
  },
  images: [{
    type: String // URLs to room images
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
roomSchema.index({ roomNumber: 1 });
roomSchema.index({ roomType: 1 });
roomSchema.index({ status: 1 });
roomSchema.index({ floor: 1 });

module.exports = mongoose.model('Room', roomSchema);
