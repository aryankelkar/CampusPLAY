import Equipment from '../models/Equipment.js';
import EquipmentBooking from '../models/EquipmentBooking.js';
import EquipmentInventoryTransaction from '../models/EquipmentInventoryTransaction.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { 
  calculateAvailableQuantity, 
  seedDefaultEquipment, 
  recordInventoryTransaction 
} from '../services/equipmentService.js';
import { emitBookingUpdate } from '../services/socketService.js';

// GET /api/equipment
export const getEquipment = async (req, res) => {
  try {
    await seedDefaultEquipment();

    const { date, collectionTime, returnTime } = req.query;
    const items = await Equipment.find().sort({ category: 1, name: 1 });

    const itemsWithAvailability = await Promise.all(
      items.map(async (item) => {
        const itemObj = item.toObject();
        if (date && collectionTime && returnTime) {
          itemObj.availableQuantity = await calculateAvailableQuantity(item._id, date, collectionTime, returnTime);
        } else {
          itemObj.availableQuantity = await calculateAvailableQuantity(item._id, null, null, null);
        }
        return itemObj;
      })
    );

    return sendSuccess(res, { equipment: itemsWithAvailability }, 'Equipment list fetched');
  } catch (err) {
    console.error('❌ Error fetching equipment:', err);
    return sendError(res, 'Server error fetching equipment', 500);
  }
};

// POST /api/equipment (Admin only)
export const createEquipment = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return sendError(res, 'Only administrators can add equipment', 403);
    }

    const { name, category, description, totalQuantity, image } = req.body;
    if (!name || totalQuantity === undefined) {
      return sendError(res, 'Name and total quantity are required', 400);
    }

    const equipment = await Equipment.create({
      name,
      category: category || 'General',
      description: description || '',
      totalQuantity: Number(totalQuantity),
      image: image || '',
    });

    return sendSuccess(res, { equipment }, 'Equipment created successfully', 201);
  } catch (err) {
    console.error('❌ Error creating equipment:', err);
    return sendError(res, err.message || 'Error creating equipment', 400);
  }
};

// PUT /api/equipment/:id (Admin only)
export const updateEquipment = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return sendError(res, 'Only administrators can update equipment', 403);
    }

    const equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!equipment) return sendError(res, 'Equipment not found', 404);

    return sendSuccess(res, { equipment }, 'Equipment updated successfully');
  } catch (err) {
    return sendError(res, err.message || 'Error updating equipment', 400);
  }
};

// DELETE /api/equipment/:id (Admin only)
export const deleteEquipment = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return sendError(res, 'Only administrators can delete equipment', 403);
    }

    const equipment = await Equipment.findByIdAndDelete(req.params.id);
    if (!equipment) return sendError(res, 'Equipment not found', 404);

    return sendSuccess(res, { equipment }, 'Equipment deleted successfully');
  } catch (err) {
    return sendError(res, 'Error deleting equipment', 500);
  }
};

// POST /api/equipment-bookings (Create Pending equipment booking)
export const createEquipmentBooking = async (req, res) => {
  try {
    const { equipmentId, quantity, date, collectionTime, returnTime, groundBookingId } = req.body;

    if (!equipmentId || !quantity || !date || !collectionTime || !returnTime) {
      return sendError(res, 'Equipment ID, quantity, date, collection time, and return time are required', 400);
    }

    const equipmentItem = await Equipment.findById(equipmentId);
    if (!equipmentItem) return sendError(res, 'Equipment item not found', 404);

    const requestedQty = Number(quantity);
    if (requestedQty <= 0) return sendError(res, 'Quantity must be at least 1', 400);

    if (requestedQty > equipmentItem.totalQuantity) {
      return sendError(res, `Requested quantity exceeds total equipment inventory (${equipmentItem.totalQuantity})`, 400);
    }

    // Student snapshot
    const studentSnapshot = {
      studentName: req.user?.name || '',
      studentEmail: req.user?.email || '',
      studentRoll: req.user?.roll || '',
      phone: req.user?.phone || '',
      branch: req.user?.branch || '',
      division: req.user?.division || '',
      classYear: req.user?.classYear || '',
    };

    // Pending equipment booking
    const booking = await EquipmentBooking.create({
      student: req.user._id,
      equipment: equipmentItem._id,
      quantity: requestedQty,
      date,
      collectionTime,
      returnTime,
      status: 'Pending',
      ...studentSnapshot,
      equipmentName: equipmentItem.name,
      equipmentCategory: equipmentItem.category,
      groundBookingId: groundBookingId || undefined,
    });

    emitBookingUpdate('equipment-booking:created', { booking });

    return sendSuccess(res, { booking }, 'Equipment booking request submitted', 201);
  } catch (err) {
    console.error('❌ Error creating equipment booking:', err);
    return sendError(res, err.message || 'Server error creating equipment booking', 500);
  }
};

// GET /api/equipment-bookings
export const getEquipmentBookings = async (req, res) => {
  try {
    const filter = req.user?.role === 'student' ? { student: req.user._id } : {};
    if (req.query?.status) filter.status = req.query.status;

    const bookings = await EquipmentBooking.find(filter)
      .populate('student', 'name email roll branch division classYear')
      .populate('equipment', 'name category image totalQuantity')
      .sort({ createdAt: -1 });

    return sendSuccess(res, { bookings }, 'Equipment bookings fetched');
  } catch (err) {
    console.error('❌ Error fetching equipment bookings:', err);
    return sendError(res, 'Server error fetching equipment bookings', 500);
  }
};

// PUT /api/equipment-bookings/:id/approve (Admin only)
export const approveEquipmentBooking = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return sendError(res, 'Only administrators can approve equipment bookings', 403);
    }

    const booking = await EquipmentBooking.findById(req.params.id);
    if (!booking) return sendError(res, 'Equipment booking not found', 404);

    // Perform fresh database inventory conflict check!
    const available = await calculateAvailableQuantity(
      booking.equipment,
      booking.date,
      booking.collectionTime,
      booking.returnTime,
      booking._id
    );

    if (available < booking.quantity) {
      return sendError(
        res,
        `Approval conflict: insufficient equipment is available for this reservation. Available: ${available}, Requested: ${booking.quantity}.`,
        409
      );
    }

    booking.status = 'Approved';
    booking.approvedBy = req.user?.email || req.user?.name || 'admin';
    booking.approvedAt = new Date();
    booking.rejectionReason = '';
    await booking.save();

    await recordInventoryTransaction({
      equipmentId: booking.equipment,
      equipmentBookingId: booking._id,
      transactionType: 'RESERVATION_APPROVED',
      quantity: booking.quantity,
      previousAvailable: available,
      resultingAvailable: Math.max(0, available - booking.quantity),
      performedBy: req.user?.email || req.user?.name || 'admin',
      performedByRole: 'admin',
      notes: `Reservation approved for ${booking.studentName || 'student'}.`,
    });

    emitBookingUpdate('equipment-booking:approved', { booking });

    return sendSuccess(res, { booking }, 'Equipment booking approved successfully');
  } catch (err) {
    console.error('❌ Error approving equipment booking:', err);
    return sendError(res, 'Server error approving equipment booking', 500);
  }
};

// PUT /api/equipment-bookings/:id/ready (Admin only: Mark as Ready for Collection)
export const markEquipmentAsReady = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return sendError(res, 'Only administrators can update collection status', 403);
    }

    const booking = await EquipmentBooking.findById(req.params.id);
    if (!booking) return sendError(res, 'Equipment booking not found', 404);

    if (booking.status !== 'Approved') {
      return sendError(res, `Cannot mark as ready for collection from status "${booking.status}". Must be Approved.`, 400);
    }

    booking.status = 'Ready for Collection';
    await booking.save();

    emitBookingUpdate('equipment-booking:ready', { booking });

    return sendSuccess(res, { booking }, 'Equipment marked ready for collection');
  } catch (err) {
    console.error('Error marking equipment ready:', err);
    return sendError(res, 'Server error updating equipment status', 500);
  }
};

// PUT /api/equipment-bookings/:id/issue (Admin only: Physically issue equipment)
export const markEquipmentAsIssued = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return sendError(res, 'Only administrators can issue equipment', 403);
    }

    const booking = await EquipmentBooking.findById(req.params.id);
    if (!booking) return sendError(res, 'Equipment booking not found', 404);

    if (booking.status !== 'Approved' && booking.status !== 'Ready for Collection') {
      return sendError(res, `Cannot issue equipment from status "${booking.status}". Must be Approved or Ready for Collection.`, 400);
    }

    const previousAvailable = await calculateAvailableQuantity(booking.equipment, null, null, null);

    booking.status = 'Issued';
    booking.issuedAt = new Date();
    booking.issuedBy = req.user?.email || req.user?.name || 'admin';
    booking.quantityIssued = booking.quantity;
    if (req.body?.expectedReturnAt) {
      booking.expectedReturnAt = new Date(req.body.expectedReturnAt);
    }
    await booking.save();

    const resultingAvailable = await calculateAvailableQuantity(booking.equipment, null, null, null);

    await recordInventoryTransaction({
      equipmentId: booking.equipment,
      equipmentBookingId: booking._id,
      transactionType: 'ISSUED',
      quantity: booking.quantity,
      previousAvailable,
      resultingAvailable,
      performedBy: req.user?.email || req.user?.name || 'admin',
      performedByRole: 'admin',
      notes: `Physically issued ${booking.quantity} units to ${booking.studentName || 'student'}.`,
    });

    emitBookingUpdate('equipment-booking:issued', { booking });

    return sendSuccess(res, { booking }, 'Equipment physically issued successfully');
  } catch (err) {
    console.error('Error issuing equipment:', err);
    return sendError(res, 'Server error issuing equipment', 500);
  }
};

// PUT /api/equipment-bookings/:id/request-return (Student reports return)
export const requestEquipmentReturn = async (req, res) => {
  try {
    const booking = await EquipmentBooking.findById(req.params.id);
    if (!booking) return sendError(res, 'Equipment request not found', 404);

    // Verify ownership
    if (req.user?.role !== 'admin' && String(booking.student) !== String(req.user._id)) {
      return sendError(res, 'Not authorized to request return for this equipment booking', 403);
    }

    // Check status eligibility
    if (booking.status === 'Return Requested') {
      return sendError(res, 'A return request has already been submitted for this equipment. Awaiting administrator inspection.', 400);
    }
    if (booking.status === 'Returned') {
      return sendError(res, 'This equipment has already been marked returned and confirmed.', 400);
    }
    const returnableStatuses = ['Issued', 'Approved', 'Ready for Collection', 'Overdue'];
    if (!returnableStatuses.includes(booking.status)) {
      return sendError(res, `Cannot report return for equipment with status "${booking.status}". Equipment must be approved or issued.`, 400);
    }

    if (!booking.quantityIssued) {
      booking.quantityIssued = booking.quantity;
    }

    booking.status = 'Return Requested';
    booking.returnRequestedAt = new Date();
    await booking.save();

    // Note: Stock is NOT modified here; physical confirmation is required!
    emitBookingUpdate('equipment-booking:return-requested', { booking });

    return sendSuccess(res, { booking }, 'Equipment return submitted. Confirmation is pending physical inspection by desk staff.');
  } catch (err) {
    console.error('Error requesting equipment return:', err);
    return sendError(res, 'Server error requesting equipment return', 500);
  }
};

// PUT /api/equipment-bookings/:id/confirm-return (Admin confirms physical return)
export const confirmEquipmentReturn = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return sendError(res, 'Only administrators can confirm physical equipment returns', 403);
    }

    const booking = await EquipmentBooking.findById(req.params.id);
    if (!booking) return sendError(res, 'Equipment request not found', 404);

    // Idempotency: prevent double return
    if (booking.status === 'Returned' || booking.returnConfirmedAt) {
      return sendError(res, 'Return has already been confirmed for this equipment reservation. Stock has already been restored.', 400);
    }

    const validStatuses = ['Issued', 'Approved', 'Ready for Collection', 'Return Requested', 'Return Issue', 'Overdue'];
    if (!validStatuses.includes(booking.status)) {
      return sendError(res, `Cannot confirm return for equipment with status "${booking.status}". Must be active, issued, or return requested.`, 400);
    }

    const issuedQty = booking.quantityIssued || booking.quantity;
    const { 
      quantityReturned = issuedQty, 
      quantityDamaged = 0, 
      quantityMissing = 0,
      returnCondition = 'Good',
      returnNotes = '',
      statusOverride = null
    } = req.body;

    const returnedNum = Number(quantityReturned);
    const damagedNum = Number(quantityDamaged);
    const missingNum = Number(quantityMissing);

    if (isNaN(returnedNum) || returnedNum < 0 || isNaN(damagedNum) || damagedNum < 0 || isNaN(missingNum) || missingNum < 0) {
      return sendError(res, 'Returned, damaged, and missing quantities must be non-negative numbers.', 400);
    }

    // Require quantities to reconcile with issued quantity
    if (returnedNum + damagedNum + missingNum !== issuedQty) {
      return sendError(
        res,
        `Reconciliation error: Total issued units (${issuedQty}) must equal Returned (${returnedNum}) + Damaged (${damagedNum}) + Missing (${missingNum}).`,
        400
      );
    }

    const previousAvailable = await calculateAvailableQuantity(booking.equipment, null, null, null);

    // Update equipment damaged / missing counts if any
    const equipmentItem = await Equipment.findById(booking.equipment);
    if (equipmentItem) {
      if (damagedNum > 0) {
        equipmentItem.damagedQuantity = (equipmentItem.damagedQuantity || 0) + damagedNum;
      }
      if (missingNum > 0) {
        equipmentItem.missingQuantity = (equipmentItem.missingQuantity || 0) + missingNum;
      }
      await equipmentItem.save();
    }

    // Determine final status
    let finalStatus = 'Returned';
    if (statusOverride && ['Returned', 'Return Issue'].includes(statusOverride)) {
      finalStatus = statusOverride;
    } else if (damagedNum > 0 || missingNum > 0) {
      finalStatus = req.body.flagAsIssue ? 'Return Issue' : 'Returned';
    }

    booking.status = finalStatus;
    booking.quantityReturned = returnedNum;
    booking.quantityDamaged = damagedNum;
    booking.quantityMissing = missingNum;
    booking.returnCondition = returnCondition;
    booking.returnNotes = returnNotes || '';
    booking.returnConfirmedAt = new Date();
    booking.returnConfirmedBy = req.user?.email || req.user?.name || 'admin';
    await booking.save();

    const resultingAvailable = await calculateAvailableQuantity(booking.equipment, null, null, null);

    // Record audit transaction
    await recordInventoryTransaction({
      equipmentId: booking.equipment,
      equipmentBookingId: booking._id,
      transactionType: 'RETURN_CONFIRMED',
      quantity: issuedQty,
      usableQuantityReturned: returnedNum,
      damagedQuantity: damagedNum,
      missingQuantity: missingNum,
      previousAvailable,
      resultingAvailable,
      performedBy: req.user?.email || req.user?.name || 'admin',
      performedByRole: 'admin',
      notes: returnNotes || `Confirmed return: ${returnedNum} usable restored, ${damagedNum} damaged, ${missingNum} missing.`,
      returnCondition,
    });

    const eventName = finalStatus === 'Return Issue' ? 'equipment-booking:return-issue' : 'equipment-booking:returned';
    emitBookingUpdate(eventName, { booking });

    return sendSuccess(
      res, 
      { 
        booking, 
        inventory: {
          usableRestored: returnedNum,
          damaged: damagedNum,
          missing: missingNum,
          currentAvailable: resultingAvailable
        } 
      }, 
      'Equipment return confirmed successfully'
    );
  } catch (err) {
    console.error('Error confirming equipment return:', err);
    return sendError(res, 'Server error confirming equipment return', 500);
  }
};

// PUT /api/equipment-bookings/:id/reject (Admin only)
export const rejectEquipmentBooking = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return sendError(res, 'Only administrators can reject equipment bookings', 403);
    }

    const booking = await EquipmentBooking.findById(req.params.id);
    if (!booking) return sendError(res, 'Equipment booking not found', 404);

    booking.status = 'Rejected';
    booking.rejectedBy = req.user?.email || req.user?.name || 'admin';
    booking.rejectedAt = new Date();
    booking.rejectionReason = req.body?.reason || '';
    await booking.save();

    emitBookingUpdate('equipment-booking:rejected', { booking });

    return sendSuccess(res, { booking }, 'Equipment booking rejected');
  } catch (err) {
    return sendError(res, 'Server error rejecting equipment booking', 500);
  }
};

// PUT /api/equipment-bookings/:id/cancel (Student or Admin)
export const cancelEquipmentBooking = async (req, res) => {
  try {
    const booking = await EquipmentBooking.findById(req.params.id);
    if (!booking) return sendError(res, 'Equipment booking not found', 404);

    if (req.user?.role !== 'admin' && String(booking.student) !== String(req.user._id)) {
      return sendError(res, 'Not authorized to cancel this booking', 403);
    }

    const cancellableStatuses = ['Pending', 'Approved', 'Ready for Collection'];
    if (!cancellableStatuses.includes(booking.status)) {
      return sendError(res, 'Only pending, approved, or ready-for-collection equipment bookings can be cancelled before physical issuance', 400);
    }

    const wasAllocated = booking.status === 'Approved' || booking.status === 'Ready for Collection';
    booking.status = 'Cancelled';
    booking.canceledAt = new Date();
    await booking.save();

    if (wasAllocated) {
      await recordInventoryTransaction({
        equipmentId: booking.equipment,
        equipmentBookingId: booking._id,
        transactionType: 'RESERVATION_CANCELLED',
        quantity: booking.quantity,
        performedBy: req.user?.email || req.user?.name || 'user',
        performedByRole: req.user?.role || 'student',
        notes: 'Reservation cancelled before issuance.',
      });
    }

    emitBookingUpdate('equipment-booking:cancelled', { booking });

    return sendSuccess(res, { booking }, 'Equipment booking cancelled');
  } catch (err) {
    return sendError(res, 'Server error cancelling equipment booking', 500);
  }
};

// GET /api/equipment-bookings/transactions (Admin only: view inventory audit history)
export const getEquipmentInventoryTransactions = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return sendError(res, 'Only administrators can view inventory audit history', 403);
    }

    const filter = {};
    if (req.query?.equipmentId) filter.equipment = req.query.equipmentId;

    const transactions = await EquipmentInventoryTransaction.find(filter)
      .populate('equipment', 'name category totalQuantity damagedQuantity missingQuantity')
      .populate('equipmentBooking', 'studentName studentRoll date status')
      .sort({ createdAt: -1 })
      .limit(100);

    return sendSuccess(res, { transactions }, 'Inventory transactions fetched');
  } catch (err) {
    console.error('Error fetching inventory transactions:', err);
    return sendError(res, 'Server error fetching inventory audit', 500);
  }
};

// DELETE /api/equipment-bookings/:id (Delete record)
export const deleteEquipmentBooking = async (req, res) => {
  try {
    const booking = await EquipmentBooking.findById(req.params.id);
    if (!booking) return sendError(res, 'Equipment booking not found', 404);

    if (req.user?.role === 'student' && String(booking.student) !== String(req.user._id)) {
      return sendError(res, 'Not authorized to delete this booking', 403);
    }

    await EquipmentBooking.findByIdAndDelete(req.params.id);

    emitBookingUpdate('equipment-booking:deleted', { booking });

    return sendSuccess(res, { booking }, 'Equipment booking deleted');
  } catch (err) {
    return sendError(res, 'Server error deleting equipment booking', 500);
  }
};
