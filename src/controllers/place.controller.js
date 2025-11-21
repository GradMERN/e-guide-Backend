import { generateToken } from "../utils/jwt.utils.js";

// OAuth callback (Google)
export const googleCallback = (req, res) => {
  const token = generateToken({ id: req.user._id });
  res.redirect(`http://localhost:5173/oauth-success?token=${token}`);
};

export default { googleCallback };
