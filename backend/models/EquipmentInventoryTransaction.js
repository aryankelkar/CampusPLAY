import mongoose from 'mongoose';

const equipmentInventoryTransactionSchema = new mongoose.Schema(
  {
    equipment: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true, index: true },
    equipmentBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'EquipmentBooking', index: true },
    transactionType: {
      type: String,
      enum: [
        'INITIAL_STOCK',
        'RESERVATION_APPROVED',
        'RESERVATION_CANCELLED',
        'ISSUED',
        'RETURN_CONFIRMED',
        'DAMAGE_RECORDED',
        'MISSING_RECORDED',
        'STOCK_ADJUSTMENT',
      ],
      required: true,
    },
    quantity: { type: Number, required: true },
    usableQuantityReturned: { type: Number, default: 0 },
    damagedQuantity: { type: Number, default: 0 },
    missingQuantity: { type: Number, default: 0 },
    previousAvailable: { type: Number },
    resultingAvailable: { type: Number },
    performedBy: { type: String, required: true },
    performedByRole: { type: String, enum: ['admin', 'student', 'system'], default: 'admin' },
    notes: { type: String, default: '' },
    returnCondition: { type: String, default: '' },
  },
  { timestamps: true }
);

equipmentInventoryTransactionSchema.index({ equipment: 1, createdAt: -1 });

const EquipmentInventoryTransaction = mongoose.model(
  'EquipmentInventoryTransaction',
  equipmentInventoryTransactionSchema
);

export default EquipmentInventoryTransaction;
