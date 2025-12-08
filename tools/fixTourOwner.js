import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// load tools/.env first
dotenv.config({ path: path.resolve(__dirname, ".env") });
if (!process.env.MONGO_URI)
  dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import User from "../src/models/user.model.js";
import Tour from "../src/models/tour.model.js";
import Place from "../src/models/place.model.js";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/e-guide-dev";

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to", MONGO_URI);

  const targetEmail = "abdelrhmanosama298@gmail.com";
  let user = await User.findOne({ email: targetEmail });
  if (!user) {
    // generate a unique phone similar to seeder
    const rand = Math.floor(Math.random() * 1e8)
      .toString()
      .padStart(8, "0");
    const phone = `10${rand}`;
    user = await User.create({
      firstName: "Abdel",
      lastName: "Osama",
      email: targetEmail,
      phone,
      role: "guide",
      password: "Password123!",
    });
    console.log("Created user", user._id.toString());
  } else {
    console.log("Found user", user._id.toString());
  }

  const tourName = "Mystical Giza Pyramids & Sphinx Experience";
  const tour = await Tour.findOne({ name: tourName });
  if (!tour) {
    console.log("No tour found with name", tourName);
    process.exit(0);
  }

  tour.guide = user._id;
  await tour.save();
  console.log(
    "Updated tour guide to",
    targetEmail,
    "tour id",
    tour._id.toString()
  );

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
