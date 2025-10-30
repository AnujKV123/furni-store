export const success = (res: any, payload: any, status = 200) => {
  return res.status(status).json({ success: true, data: payload });
};

export const fail = (res: any, message: string, status = 400) => {
  return res.status(status).json({ success: false, error: message });
};
