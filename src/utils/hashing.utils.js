import bcrypt from "bcrypt";

// Salt rounds: 12 provides good security while maintaining acceptable performance
const SALT_ROUNDS = 12;

export const hashPassword = async (password) => {
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  return hashedPassword;
};

export const comparePassword = async (password, hashedPassword) => {
  const isMatch = await bcrypt.compare(password, hashedPassword);
  return isMatch;
};
