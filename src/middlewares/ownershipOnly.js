import mongoose from "mongoose";

export const ownershipOnly = (Model, ownerField = "user") => {
  return async (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const doc = await Model.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Resource not found" });
    }

    if (doc[ownerField].toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to modify this resource",
      });
    }

    req.doc = doc;
    next();
  };
};
