import { generateToken } from "../utils/jwt.utils.js";

const FRONTEND_URL = process.env.CLIENT_URL || "http://localhost:5173";

const googleCallback = (req, res) => {
  // Include email and role in JWT payload for consistency with other auth flows
  const token = generateToken({
    id: req.user._id,
    email: req.user.email,
    role: req.user.role,
  });
  res.redirect(`${FRONTEND_URL}/oauth-success?token=${token}`);
};

export default googleCallback;
