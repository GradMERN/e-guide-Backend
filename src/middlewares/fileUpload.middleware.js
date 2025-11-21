import multer from "multer";
import fs from "fs";
import path from "path";

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const base = path.join(process.cwd(), "public", "tours");
    ensureDir(base);
    if (req.params.tourId && req.params.itemId) {
      const itemDir = path.join(
        base,
        req.params.tourId,
        "items",
        req.params.itemId
      );
      ensureDir(path.join(itemDir, "images"));
      ensureDir(path.join(itemDir, "audio"));
      cb(
        null,
        file.fieldname === "audio"
          ? path.join(itemDir, "audio")
          : path.join(itemDir, "images")
      );
      return;
    }
    if (req.params.tourId) {
      const tourDir = path.join(base, req.params.tourId, "cover-images");
      ensureDir(tourDir);
      cb(
        null,
        file.fieldname === "mainImg"
          ? path.join(base, req.params.tourId)
          : tourDir
      );
      return;
    }
    cb(null, base);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${file.fieldname}-${Date.now()}${Math.floor(
      Math.random() * 10000
    )}${ext}`;
    cb(null, name);
  },
});

export const upload = multer({ storage });
