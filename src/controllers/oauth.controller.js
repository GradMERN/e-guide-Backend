import { generateToken } from "../utils/jwt.utils.js";

const FRONTEND_URL = process.env.CLIENT_URL || "http://localhost:5173";

const googleCallback = (req, res) => {
  const token = generateToken({ id: req.user._id });
  res.redirect(`${FRONTEND_URL}/oauth-success?token=${token}`);
};

export default googleCallback;
