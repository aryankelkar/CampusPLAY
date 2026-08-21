import Equipment from '../models/Equipment.js';
import EquipmentBooking from '../models/EquipmentBooking.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { calculateAvailableQuantity, seedDefaultEquipment } from '../services/equipmentService.js';
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

    emitBookingUpdate('equipment-booking:approved', { booking });

    return sendSuccess(res, { booking }, 'Equipment booking approved successfully');
  } catch (err) {
    console.error('❌ Error approving equipment booking:', err);
    return sendError(res, 'Server error approving equipment booking', 500);
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

// PUT /api/equipment-bookings/:id/cancel (Student only)
export const cancelEquipmentBooking = async (req, res) => {
  try {
    const booking = await EquipmentBooking.findById(req.params.id);
    if (!booking) return sendError(res, 'Equipment booking not found', 404);

    if (req.user?.role !== 'admin' && String(booking.student) !== String(req.user._id)) {
      return sendError(res, 'Not authorized to cancel this booking', 403);
    }

    if (booking.status !== 'Pending' && booking.status !== 'Approved') {
      return sendError(res, 'Only pending or approved equipment bookings can be cancelled', 400);
    }

    booking.status = 'Cancelled';
    booking.canceledAt = new Date();
    await booking.save();

    emitBookingUpdate('equipment-booking:cancelled', { booking });

    return sendSuccess(res, { booking }, 'Equipment booking cancelled');
  } catch (err) {
    return sendError(res, 'Server error cancelling equipment booking', 500);
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
