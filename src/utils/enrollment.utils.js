import Enrollment from "../models/enrollment.model.js";

/**
 * Find the best active enrollment for a user on a specific tour.
 * When a user has multiple enrollments for the same tour (some expired, some not),
 * this function returns the most appropriate one:
 * 1. Prefers non-expired enrollments with status "started" or "active"
 * 2. Falls back to the most recently expiring enrollment if all are expired
 * 
 * @param {string} tourId - The tour ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} The best enrollment or null if none found
 */
export const findActiveEnrollment = async (tourId, userId) => {
  if (!tourId || !userId) return null;
  
  // Find all enrollments for this user and tour
  const enrollments = await Enrollment.find({ tour: tourId, user: userId });
  
  if (!enrollments || enrollments.length === 0) return null;
  
  const now = new Date();
  
  // Sort by expiresAt descending (most recent expiration first)
  const sorted = enrollments.sort((a, b) => {
    const aExp = a.expiresAt ? new Date(a.expiresAt) : new Date(0);
    const bExp = b.expiresAt ? new Date(b.expiresAt) : new Date(0);
    return bExp - aExp;
  });
  
  // Find the first non-expired enrollment with valid status
  const validStatuses = ["started", "active"];
  const activeEnrollment = sorted.find((e) => {
    const isNotExpired = !e.expiresAt || new Date(e.expiresAt) > now;
    const hasValidStatus = validStatuses.includes(e.status);
    return isNotExpired && hasValidStatus;
  });
  
  if (activeEnrollment) return activeEnrollment;
  
  // If no active enrollment, find any non-expired (including pending)
  const nonExpired = sorted.find((e) => !e.expiresAt || new Date(e.expiresAt) > now);
  if (nonExpired) return nonExpired;
  
  // All expired - return the most recently expired one
  return sorted[0] || null;
};

/**
 * Check if a user has an active (non-expired, started) enrollment for a tour
 * 
 * @param {string} tourId - The tour ID
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} True if user has active enrollment
 */
export const hasActiveEnrollment = async (tourId, userId) => {
  const enrollment = await findActiveEnrollment(tourId, userId);
  if (!enrollment) return false;
  
  const now = new Date();
  const isNotExpired = !enrollment.expiresAt || new Date(enrollment.expiresAt) > now;
  const isStarted = enrollment.status === "started";
  
  return isNotExpired && isStarted;
};

export default { findActiveEnrollment, hasActiveEnrollment };
