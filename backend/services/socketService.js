/**
 * Socket.io Service for Real-time Updates
 */

let io = null;

export const initializeSocket = (socketIO) => {
  io = socketIO;
  
  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });

    // Join admin room
    socket.on('join-admin', () => {
      socket.join('admin-room');
      console.log(`Admin joined: ${socket.id}`);
    });

    // Join student room
    socket.on('join-student', (userId) => {
      socket.join(`student-${userId}`);
      console.log(`Student ${userId} joined: ${socket.id}`);
    });
  });
};

export const emitBookingUpdate = (event, data) => {
  if (!io) return;
  
  // Emit to admin room
  io.to('admin-room').emit(event, data);
  
  // Emit to specific student if booking has student ID
  if (data.booking?.student?._id || data.booking?.student) {
    const studentId = data.booking.student._id || data.booking.student;
    io.to(`student-${studentId}`).emit(event, data);
  }
};

export const getIO = () => io;
