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
  email: {
    type: String,
    required: true,
    match: /.+\@.+\..+/
  },
 phoneNumber: {
  type: String,
  required: true
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
  paymentMethod: {
    type: String,
    required: true,
    enum: ['card', 'cash_on_delivery']
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Order', orderSchema);
