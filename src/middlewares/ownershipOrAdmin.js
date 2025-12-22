import mongoose from "mongoose";

export const ownershipOrAdmin = (Model, ownerField = "user") => {
  return async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const doc = await Model.findById(id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Resource not found" });
    }

    const isOwner = doc[ownerField].toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only the owner or an admin can perform this action",
      });
    }

    req.doc = doc;
    next();
  };
};
