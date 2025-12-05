import multer from "multer";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // optional: 100MB limit
  fileFilter: (req, file, cb) => {
    console.log("----- Multer File Received -----");
    console.log("Field name:", file.fieldname);
    console.log("Original name:", file.originalname);
    console.log("MIME type:", file.mimetype);
    console.log("Size:", file.size);
    console.log("-------------------------------");
    cb(null, true); // accept the file
  },
});
