const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    minlength: 3
  },
  lastName: {
    type: String,
    required: true,
    minlength: 3
  },
  postOfficeBranch: {
    type: String,
    required: true
  },
  orderItems: [
    {
      productName: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);
