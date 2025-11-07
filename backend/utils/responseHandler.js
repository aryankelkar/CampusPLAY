export const sendSuccess = (res, data = null, message = 'OK', status = 200) => {
  return res.status(status).json({ success: true, message, data });
};

export const sendError = (res, message = 'Error', status = 400, extra = {}) => {
  return res.status(status).json({ success: false, message, ...extra });
};
