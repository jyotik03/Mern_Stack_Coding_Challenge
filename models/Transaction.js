import mongoose from 'mongoose'; // Use import instead of require

const transactionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  sold: { type: Boolean, required: true },
  dateOfSale: { type: Date, required: true },
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction; // Use export default
