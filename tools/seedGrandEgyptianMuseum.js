import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Tour from "../src/models/tour.model.js";
import TourItem from "../src/models/tourItem.model.js";
import Place from "../src/models/place.model.js";
import User from "../src/models/user.model.js";

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.DATABASE_URL ||
  "mongodb://127.0.0.1:27017/e-guide-dev";

async function connect() {
  await mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log("Connected to MongoDB:", MONGO_URI);
}

function randOffset() {
  // small jitter ~ +/- 0.0004 degrees (~ up to ~40m)
  return (Math.random() - 0.5) * 0.0008;
}

async function upsertPlace() {
  const name = "Grand Egyptian Museum";
  let place = await Place.findOne({ name });
  if (!place) {
    place = await Place.create({
      name,
      country: "Egypt",
      city: "Giza",
      category: "cultural",
    });
    console.log("Created place:", place._id.toString());
  } else {
    console.log("Found place:", place._id.toString());
  }
  return place;
}

async function upsertGuide() {
  const email = "gem-guide@example.com";
  let guide = await User.findOne({ email });
  if (!guide) {
    guide = await User.create({
      firstName: "Gem",
      lastName: "Guide",
      email,
      role: "guide",
      password: "Password123!",
    });
    console.log("Created guide:", guide._id.toString());
  } else {
    console.log("Found guide:", guide._id.toString());
  }
  return guide;
}

async function createTour(place, guide) {
  const tourData = {
    name: "Grand Egyptian Museum Guided Tour",
    description:
      "A comprehensive guided walk through the Grand Egyptian Museum, exploring ancient artifacts, royal tomb objects and modern exhibition halls.",
    price: 250,
    currency: "EGP",
    itemsCount: 40,
    mainImage: {
      url: "https://source.unsplash.com/1200x800/?grand,egyptian,museum&sig=0",
    },
    galleryImages: [],
    place: place._id,
    guide: guide._id,
    difficulty: "moderate",
    isPublished: true,
    categories: ["museum", "history", "egypt"],
    languages: ["en", "ar"],
  };

  const existing = await Tour.findOne({
    name: tourData.name,
    guide: guide._id,
  });
  if (existing) {
    console.log("Tour already exists:", existing._id.toString());
    return existing;
  }

  const tour = await Tour.create(tourData);
  console.log("Created tour:", tour._id.toString());
  return tour;
}

async function createItems(tour) {
  // Base coordinates for Grand Egyptian Museum (approx)
  const baseLat = 29.9761; // latitude
  const baseLng = 31.1319; // longitude

  const contentTypes = [
    "informational",
    "interactive",
    "activity",
    "photo-spot",
  ];

  const items = [];
  for (let i = 1; i <= 40; i++) {
    const lat = baseLat + randOffset();
    const lng = baseLng + randOffset();

    const imgUrl = `https://source.unsplash.com/800x600/?egypt,museum,artifact&sig=${i}`;

    const title = `Stop ${i} — Exhibit ${i}`;
    const script = `This is a short description for stop ${i} at the Grand Egyptian Museum. Learn about the exhibited artifact and its historical context.`;

    const itemData = {
      title,
      tour: tour._id,
      location: { type: "Point", coordinates: [lng, lat] },
      mainImage: { url: imgUrl },
      galleryImages: [],
      script,
      contentType: contentTypes[i % contentTypes.length],
      isPublished: true,
    };

    items.push(itemData);
  }

  // Bulk insert
  const created = await TourItem.insertMany(items);
  console.log(`Created ${created.length} tour items`);

  // Update tour itemsCount and push first few gallery images
  const firstImages = created
    .slice(0, 6)
    .map((it) => ({ url: it.mainImage.url }));
  await Tour.findByIdAndUpdate(tour._id, {
    itemsCount: created.length,
    mainImage: { url: firstImages[0]?.url || tour.mainImage?.url },
    galleryImages: firstImages,
  });
  console.log("Updated tour with itemsCount and gallery images");
}

async function main() {
  try {
    await connect();
    const place = await upsertPlace();
    const guide = await upsertGuide();
    const tour = await createTour(place, guide);

    // Check if tour already has items
    const existingItems = await TourItem.countDocuments({ tour: tour._id });
    if (existingItems >= 40) {
      console.log(
        `Tour already has ${existingItems} items — skipping item creation.`
      );
      process.exit(0);
    }

    await createItems(tour);
    console.log("Seeding complete.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
