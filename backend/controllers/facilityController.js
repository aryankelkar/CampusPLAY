import { 
  getFacilities, 
  getFacilityByName, 
  updateFacilityStatus,
  validateSportFacilityMatch,
  SPORT_FACILITY_MAP
} from '../services/facilityService.js';
import { getAvailableSlots } from '../services/bookingService.js';
import Facility from '../models/Facility.js';

export const listFacilities = async (req, res) => {
  try {
    const { sport } = req.query;
    const facilities = await getFacilities(sport);
    res.json({
      success: true,
      data: {
        facilities,
        sportFacilityMap: SPORT_FACILITY_MAP
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFacilityAvailability = async (req, res) => {
  try {
    const { facilityName, date } = req.query;
    if (!facilityName || !date) {
      return res.status(400).json({ success: false, message: 'facilityName and date are required.' });
    }

    const allSlots = [
      '8–9 AM', '9–10 AM', '10–11 AM', '11 AM–12 PM',
      '12–1 PM', '1–2 PM', '2–3 PM', '3–4 PM', '4–5 PM', '5–6 PM'
    ];

    const result = await getAvailableSlots(date, facilityName, allSlots);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateFacility = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, description, capacity, location, operatingHours } = req.body;

    const facility = await Facility.findByIdAndUpdate(
      id,
      { status, description, capacity, location, operatingHours },
      { new: true }
    );

    if (!facility) {
      return res.status(404).json({ success: false, message: 'Facility not found.' });
    }

    res.json({
      success: true,
      message: 'Facility updated successfully.',
      data: { facility }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
