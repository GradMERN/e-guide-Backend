import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// load .env from tools folder first, fall back to repo root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// try local tools/.env then parent .env
dotenv.config({ path: path.resolve(__dirname, ".env") });
if (!process.env.MONGO_URI) {
  dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
}

import Tour from "../src/models/tour.model.js";
import TourItem from "../src/models/tourItem.model.js";
import User from "../src/models/user.model.js";
import Place from "../src/models/place.model.js";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/e-guide-dev";

async function run() {
  await mongoose.connect(MONGO_URI, { autoIndex: false });
  console.log("Connected to:", MONGO_URI);

  const tourName = "Mystical Giza Pyramids & Sphinx Experience";
  const tour = await Tour.findOne({ name: tourName }).populate("guide");
  if (!tour) {
    console.log(`Tour not found: ${tourName}`);
    process.exit(0);
  }

  console.log("Tour ID:", tour._id.toString());
  console.log("Tour name:", tour.name);
  const guideId = tour.guide?._id?.toString() || tour.guide?.toString();
  console.log("Guide ID:", guideId || "(none)");
  let guideEmail = tour.guide?.email;
  if (!guideEmail && guideId) {
    const u = await User.findById(guideId).lean();
    guideEmail = u?.email || "(none)";
  }
  console.log("Guide email:", guideEmail || "(none)");
  console.log("Items count field:", tour.itemsCount || 0);

  const itemsCount = await TourItem.countDocuments({ tour: tour._id });
  const items = await TourItem.find({ tour: tour._id }).lean();
  console.log(`Found ${itemsCount} items:`);

  const seenById = new Map();
  const seenByUrl = new Map();

  items.forEach((it, i) => {
    const audio = it.audio || null;
    const audioId = audio?.public_id || null;
    const audioUrl = audio?.url || null;
    const audioSummary = audio
      ? `${audioId || "(no id)"} ${audioUrl || "(no url)"} duration=${
          audio.duration || "(na)"
        }`
      : "(none)";
    console.log(
      `- [${i + 1}] id=${it._id} title=${it.title} audio=${audioSummary}`
    );

    if (audioId) {
      seenById.set(audioId, (seenById.get(audioId) || 0) + 1);
    }
    if (audioUrl) {
      seenByUrl.set(audioUrl, (seenByUrl.get(audioUrl) || 0) + 1);
    }
  });

  // Report duplicates
  const dupIds = Array.from(seenById.entries()).filter(([, c]) => c > 1);
  const dupUrls = Array.from(seenByUrl.entries()).filter(([, c]) => c > 1);
  if (dupIds.length === 0 && dupUrls.length === 0) {
    console.log("No duplicate audio public_ids or urls detected across items.");
  } else {
    if (dupIds.length) {
      console.log("Duplicate audio public_ids:");
      dupIds.forEach(([id, c]) => console.log(`  ${id} — used in ${c} items`));
    }
    if (dupUrls.length) {
      console.log("Duplicate audio URLs:");
      dupUrls.forEach(([url, c]) =>
        console.log(`  ${url} — used in ${c} items`)
      );
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
