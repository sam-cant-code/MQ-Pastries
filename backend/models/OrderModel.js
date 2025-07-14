import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },

  items: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'food' }, // Reference to food
      name: { type: String, required: true },
      description: { type: String },
      image: { type: String },
      category: { type: String },

      variation: { type: String, required: true }, // e.g., "1/2 kg"
      price: { type: Number, required: true },     // snapshot of price for the variation
      quantity: { type: Number, required: true }   // how many units of this variation
    }
  ],

  amount: { type: Number, required: true },

  address: {
    type: {
      firstName: String,
      lastName: String,
      street: String,
      city: String,
      zipcode: String,  // Changed from pincode to zipcode
      state: String,
      country: String,
      email: String,
      phone: String
    },
    required: true
  },

  status: { type: String, default: 'Order Processing' },
  date: { type: Date, default: Date.now },
  payment: { type: Boolean, default: false }
});

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;