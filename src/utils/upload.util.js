import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // optional: 100MB limit
  fileFilter: (req, file, cb) => {
    cb(null, true); // accept the file
  },
});
