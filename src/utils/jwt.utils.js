import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

export const generateToken = (payload) => {
  // 7 day expiry provides balance between security and user convenience
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};
