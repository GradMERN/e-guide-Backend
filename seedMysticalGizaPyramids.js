import mongoose from "mongoose";
import dotenv from "dotenv";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

// Load .env from repository root (one level up from tools)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import Tour from "./src/models/tour.model.js";
import TourItem from "./src/models/tourItem.model.js";
import Place from "./src/models/place.model.js";
import User from "./src/models/user.model.js";
import {
  uploadStreamToCloudinary,
  deleteFromCloudinary,
} from "./src/utils/cloudinary.util.js";

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.DATABASE_URL ||
  "mongodb+srv://abdelrhmanosama_db_user:5tApBwy3AThZYCR0@cluster0.abipf4z.mongodb.net/TourGuideDB?retryWrites=true&w=majority&appName=TourGuideApp";

async function connect() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB:", MONGO_URI);
}

async function fetchBuffer(url) {
  const maxAttempts = 3;
  let attempt = 0;
  while (attempt < maxAttempts) {
    try {
      const res = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 15000,
      });
      return Buffer.from(res.data);
    } catch (err) {
      attempt += 1;
      console.warn(
        `fetchBuffer attempt ${attempt} failed for ${url}:`,
        err.message
      );
      if (attempt >= maxAttempts) throw err;
      // small backoff
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

const mysticalGizaPyramidsTour = {
  name: "Mystical Giza Pyramids & Sphinx Experience",
  description:
    "Embark on an unforgettable journey through the ancient wonders of Giza. This immersive tour takes you deep into the mysteries of the Great Pyramids, the enigmatic Sphinx, and the surrounding archaeological sites. Experience the magic of ancient Egypt with expert guides, fascinating stories, and breathtaking views.",
  price: 2500,
  itemsCount: 20,
  currency: "EGP",
  // Use picsum.photos seeded placeholder images for more reliable fetching
  mainImage: {
    url: "https://picsum.photos/seed/giza/1600/900",
    public_id: "tours/giza-panorama",
  },
  galleryImages: [
    {
      url: "https://picsum.photos/seed/giza1/1200/800",
      public_id: "tours/giza-1",
    },
    {
      url: "https://picsum.photos/seed/giza2/1200/800",
      public_id: "tours/giza-2",
    },
    {
      url: "https://picsum.photos/seed/giza3/1200/800",
      public_id: "tours/giza-3",
    },
    {
      url: "https://picsum.photos/seed/giza4/1200/800",
      public_id: "tours/giza-4",
    },
    {
      url: "https://picsum.photos/seed/giza5/1200/800",
      public_id: "tours/giza-5",
    },
  ],
  placeName: "Giza Plateau",
  difficulty: "moderate",
  rating: 4.8,
  ratingsCount: 127,
  enrollmentsCount: 543,
  isPublished: true,
  categories: [
    "Archaeological",
    "Historical",
    "Cultural",
    "Walking",
    "Day Tour",
  ],
  tags: [
    "Pyramids",
    "Sphinx",
    "Ancient Egypt",
    "Pharaohs",
    "World Heritage",
    "Seven Wonders",
  ],
  languages: ["English", "Arabic", "French", "Spanish", "German"],
};

const gizaPlaceData = {
  name: "Giza Plateau",
  country: "Egypt",
  city: "Giza",
  description:
    "The Giza pyramid complex, also called the Giza Necropolis, is the site on the Giza Plateau in Greater Cairo, Egypt that includes the Great Pyramid of Giza, the Pyramid of Khafre, and the Pyramid of Menkaure, along with their associated pyramid complexes and the Great Sphinx of Giza.",
  coordinates: [31.132496, 29.979176],
};

// Ensure we link the tour to this account if present (or create it)
const TARGET_GUIDE_EMAIL = "abdelrhmanosama298@gmail.com";
const sampleGuide = {
  firstName: "Ahmed",
  lastName: "El-Sayed",
  email: TARGET_GUIDE_EMAIL,
  role: "guide",
  bio: "Certified Egyptologist with 15 years experience guiding tours at Giza. PhD in Egyptian Archaeology from Cairo University.",
  languages: ["English", "Arabic", "French"],
  specialty: ["Pyramids", "Ancient History", "Archaeology"],
};

function buildItems() {
  return [
    {
      title: "Welcome to Giza Plateau",
      name: "Giza Plateau Entrance",
      description:
        "Welcome to the Giza Plateau, home to the last surviving wonder of the ancient world.",
      shortDescription: "Begin your journey at the main entrance",
      location: { coordinates: [31.132496, 29.979176], type: "Point" },
      img: "https://picsum.photos/seed/giza0/800/600",
      pid: "items/giza-entrance-0",
      // Use SoundHelix sample mp3 which is generally accessible
      audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      script:
        "Welcome, traveler. You stand at the threshold of one of humanity's greatest achievements...",
    },
    {
      title: "The Great Pyramid of Khufu",
      name: "Khufu Pyramid",
      description: "The largest pyramid ever built, standing 146 meters tall.",
      shortDescription: "The Great Pyramid, tomb of Pharaoh Khufu",
      location: { coordinates: [31.134238, 29.979264], type: "Point" },
      img: "https://picsum.photos/seed/giza1/800/600",
      pid: "items/khufu-pyramid-1",
      audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      script:
        "Behold the Great Pyramid of Khufu, also known as the Pyramid of Cheops...",
    },
    {
      title: "Pyramid of Khafre",
      name: "Khafre Pyramid",
      description:
        "The second-largest pyramid, still retaining some of its original casing stones at the apex.",
      shortDescription: "Pyramid of Pharaoh Khafre with intact casing",
      location: { coordinates: [31.130827, 29.978006], type: "Point" },
      img: "https://picsum.photos/seed/giza2/800/600",
      pid: "items/khafre-pyramid-2",
      audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      script: "This is the Pyramid of Khafre, son of Khufu...",
    },
    {
      title: "Pyramid of Menkaure",
      name: "Menkaure Pyramid",
      description:
        "The smallest of the three main pyramids, with three smaller queen's pyramids beside it.",
      shortDescription: "Smallest of the three main Giza pyramids",
      location: { coordinates: [31.128075, 29.973849], type: "Point" },
      img: "https://picsum.photos/seed/giza3/800/600",
      pid: "items/menkaure-pyramid-3",
      audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      script:
        "The Pyramid of Menkaure, grandson of Khufu, is the smallest of the three main pyramids...",
    },
    {
      title: "The Great Sphinx",
      name: "Sphinx of Giza",
      description:
        "The monumental limestone statue with the body of a lion and head of a human.",
      shortDescription: "Iconic Sphinx guarding the pyramids",
      location: { coordinates: [31.137605, 29.975312], type: "Point" },
      img: "https://picsum.photos/seed/giza4/800/600",
      pid: "items/sphinx-4",
      audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      script:
        "Here stands the Great Sphinx, the largest monolith statue in the world...",
    },
    {
      title: "Sphinx Temple",
      name: "Valley Temple of Khafre",
      description:
        "The temple complex at the paws of the Sphinx, used for the mummification process.",
      shortDescription: "Temple complex at Sphinx paws",
      location: { coordinates: [31.137998, 29.975176], type: "Point" },
      img: "https://picsum.photos/seed/giza5/800/600",
      pid: "items/sphinx-temple-5",
      audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      script:
        "This is the Valley Temple of Khafre, located at the paws of the Sphinx...",
    },
    {
      title: "Solar Boat Museum",
      name: "Khufu Solar Boat",
      description:
        "Museum housing the reconstructed solar boat of Pharaoh Khufu.",
      shortDescription: "Ancient Egyptian solar boat",
      location: { coordinates: [31.134891, 29.979814], type: "Point" },
      img: "https://picsum.photos/seed/giza6/800/600",
      pid: "items/solar-boat-6",
      audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      script:
        "Inside this museum is one of the most remarkable archaeological discoveries - Khufu's solar boat...",
    },
    {
      title: "Panoramic Viewpoint",
      name: "Giza Panorama Point",
      description:
        "The perfect spot to photograph all three pyramids together.",
      shortDescription: "Best photo spot for all three pyramids",
      location: { coordinates: [31.125456, 29.971234], type: "Point" },
      img: "https://picsum.photos/seed/giza7/800/600",
      pid: "items/panorama-7",
      audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      script: "This is the famous panoramic viewpoint...",
    },
    {
      title: "Queen's Pyramids",
      name: "G1a Pyramid",
      description: "The pyramids built for Khufu's queens and family members.",
      shortDescription: "Pyramids for royal queens",
      location: { coordinates: [31.135621, 29.980072], type: "Point" },
      img: "https://picsum.photos/seed/giza8/800/600",
      pid: "items/queens-pyramids-8",
      audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      script: "These smaller pyramids were built for Khufu's queens...",
    },
    {
      title: "Workers' Cemetery",
      name: "Tomb Builders Village",
      description:
        "The burial site of the pyramid builders, showing they were skilled laborers, not slaves.",
      shortDescription: "Burial site of pyramid builders",
      location: { coordinates: [31.140123, 29.976543], type: "Point" },
      img: "https://picsum.photos/seed/giza9/800/600",
      pid: "items/builders-tombs-9",
      audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      script:
        "Contrary to popular belief, the pyramids were built by skilled Egyptian workers...",
    },
    {
      title: "Eastern Cemetery",
      name: "Mastaba Tombs",
      description:
        "The mastaba tombs of nobles and officials from the 4th Dynasty.",
      shortDescription: "Nobles' tombs near pyramids",
      location: { coordinates: [31.133456, 29.977891], type: "Point" },
      img: "https://picsum.photos/seed/giza10/800/600",
      pid: "items/mastaba-10",
      audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      script:
        "These rectangular mastaba tombs belong to nobles and high officials...",
    },
    {
      title: "Causeway of Khafre",
      name: "Khafre's Causeway",
      description:
        "The ancient processional road connecting the valley temple to the mortuary temple.",
      shortDescription: "Ancient processional road",
      location: { coordinates: [31.132567, 29.976543], type: "Point" },
      img: "https://picsum.photos/seed/giza11/800/600",
      pid: "items/causeway-11",
      audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      script: "This was Khafre's causeway...",
    },
    {
      title: "Western Cemetery",
      name: "Giza West Field",
      description:
        "The largest cemetery at Giza, containing over 100 mastaba tombs.",
      shortDescription: "Largest cemetery at Giza",
      location: { coordinates: [31.131234, 29.978765], type: "Point" },
      img: "https://picsum.photos/seed/giza12/800/600",
      pid: "items/western-cemetery-12",
      audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      script: "The Western Cemetery is the largest burial ground at Giza...",
    },
    {
      title: "Sound & Light Show Area",
      name: "Sphinx Show Area",
      description:
        "The seating area for the famous Sound & Light show that illuminates the pyramids at night.",
      shortDescription: "Night show viewing area",
      location: { coordinates: [31.138765, 29.974321], type: "Point" },
      img: "https://picsum.photos/seed/giza13/800/600",
      pid: "items/light-show-13",
      audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      script: "At night, this area comes alive with the Sound & Light show...",
    },
    {
      title: "Camel Station",
      name: "Desert Camel Rides",
      description:
        "Traditional camel rides offering a unique perspective of the pyramids.",
      shortDescription: "Traditional camel ride starting point",
      location: { coordinates: [31.126543, 29.972109], type: "Point" },
      img: "https://picsum.photos/seed/giza14/800/600",
      pid: "items/camel-rides-14",
      audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      script:
        "For a traditional experience, you can take a camel ride through the desert...",
    },
    {
      title: "Modern Visitor Center",
      name: "Giza Information Center",
      description:
        "The main visitor center with exhibitions, maps, and information about the site.",
      shortDescription: "Main visitor information center",
      location: { coordinates: [31.132109, 29.975876], type: "Point" },
      img: "https://picsum.photos/seed/giza15/800/600",
      pid: "items/visitor-center-15",
      audio:
        "https://file-examples.com/wp-content/uploads/2017/11/file_example_MP3_700KB.mp3",
      script:
        "The visitor center provides essential information about the Giza Plateau...",
    },
    {
      title: "Khufu's Mortuary Temple",
      name: "Upper Temple of Khufu",
      description:
        "The temple where daily offerings were made to the deceased pharaoh's ka (soul).",
      shortDescription: "Temple for offerings to Khufu",
      location: { coordinates: [31.134876, 29.979012], type: "Point" },
      img: "https://picsum.photos/seed/giza16/800/600",
      pid: "items/mortuary-temple-16",
      audio:
        "https://file-examples.com/wp-content/uploads/2017/11/file_example_MP3_700KB.mp3",
      script: "This was Khufu's mortuary temple...",
    },
    {
      title: "Desert Plateau Edge",
      name: "Sahara Desert View",
      description:
        "The edge of the plateau overlooking the vast Sahara Desert.",
      shortDescription: "View of Sahara Desert from plateau",
      location: { coordinates: [31.124321, 29.970987], type: "Point" },
      img: "https://picsum.photos/seed/giza17/800/600",
      pid: "items/desert-view-17",
      audio:
        "https://file-examples.com/wp-content/uploads/2017/11/file_example_MP3_700KB.mp3",
      script:
        "From this vantage point, you can see the vast expanse of the Sahara Desert...",
    },
    {
      title: "Modern Cairo View",
      name: "City Skyline Viewpoint",
      description:
        "View of modern Cairo from the ancient plateau, showing the contrast of millennia.",
      shortDescription: "View of modern Cairo skyline",
      location: { coordinates: [31.139012, 29.973456], type: "Point" },
      img: "https://picsum.photos/seed/giza18/800/600",
      pid: "items/cairo-view-18",
      audio:
        "https://file-examples.com/wp-content/uploads/2017/11/file_example_MP3_700KB.mp3",
      script: "Look eastward and you'll see the skyline of modern Cairo...",
    },
    {
      title: "Sunset Viewing Platform",
      name: "Golden Hour Giza",
      description:
        "The best spot to watch the sunset over the pyramids, when they glow with golden light.",
      shortDescription: "Best sunset viewing spot",
      location: { coordinates: [31.127654, 29.971098], type: "Point" },
      img: "https://picsum.photos/seed/giza19/800/600",
      pid: "items/sunset-19",
      audio:
        "https://file-examples.com/wp-content/uploads/2017/11/file_example_MP3_700KB.mp3",
      script:
        "As our tour concludes, watch the sunset paint the pyramids in golden light...",
    },
  ];
}

async function upsertPlace() {
  let place = await Place.findOne({ name: gizaPlaceData.name });
  if (!place) {
    place = await Place.create({
      name: gizaPlaceData.name,
      country: gizaPlaceData.country,
      city: gizaPlaceData.city,
      category: "historical",
      description: gizaPlaceData.description,
      location: { type: "Point", coordinates: gizaPlaceData.coordinates },
    });
    console.log("Created place:", place._id.toString());
  } else {
    console.log("Found place:", place._id.toString());
  }
  return place;
}

async function upsertGuide() {
  // Prefer an existing user with the target email if present
  let guide = await User.findOne({ email: TARGET_GUIDE_EMAIL });
  if (!guide) {
    // Ensure phone is unique to avoid duplicate null unique-index conflict
    // Generate a valid Egyptian 10-digit local number (e.g. '10XXXXXXXX') when none provided
    const uniquePhone =
      sampleGuide.phone ||
      (() => {
        const rand = Math.floor(Math.random() * 1e8)
          .toString()
          .padStart(8, "0");
        return `10${rand}`; // will be normalized to +2XXXXXXXXXX by pre-save hook
      })();
    guide = await User.create({
      firstName: sampleGuide.firstName,
      lastName: sampleGuide.lastName,
      email: TARGET_GUIDE_EMAIL,
      phone: uniquePhone,
      role: "guide",
      bio: sampleGuide.bio,
      languages: sampleGuide.languages,
      specialty: sampleGuide.specialty,
      password: "Password123!",
    });
    console.log("Created guide:", guide._id.toString());
  } else {
    console.log("Found guide:", guide._id.toString());
  }
  return guide;
}

async function uploadTourMedia() {
  const folder = "tours/giza";
  let main;
  const cloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

  if (!cloudinaryConfigured) {
    console.warn(
      "Cloudinary credentials not found in environment — skipping uploads and using source URLs."
    );
    main = {
      url: mysticalGizaPyramidsTour.mainImage.url,
      public_id: mysticalGizaPyramidsTour.mainImage.public_id,
    };
  } else {
    try {
      const mainBuf = await fetchBuffer(mysticalGizaPyramidsTour.mainImage.url);
      main = await uploadStreamToCloudinary(mainBuf, folder);
    } catch (e) {
      console.warn("Main tour image upload failed", e.message);
      main = {
        url: mysticalGizaPyramidsTour.mainImage.url,
        public_id: mysticalGizaPyramidsTour.mainImage.public_id,
      };
    }
  }

  const gallery = [];
  for (const g of mysticalGizaPyramidsTour.galleryImages) {
    if (!cloudinaryConfigured) {
      gallery.push({ url: g.url, public_id: g.public_id });
      continue;
    }
    try {
      const buf = await fetchBuffer(g.url);
      const up = await uploadStreamToCloudinary(buf, folder);
      gallery.push(up);
    } catch (e) {
      console.warn("Gallery upload failed for", g.url, e.message);
      gallery.push({ url: g.url, public_id: g.public_id });
    }
  }
  return { main, gallery };
}

async function createTour(place, guide) {
  const existing = await Tour.findOne({
    name: mysticalGizaPyramidsTour.name,
    guide: guide._id,
  });
  if (existing) {
    console.log(
      "Found existing tour — removing before reupload:",
      existing._id.toString()
    );

    try {
      // Delete tour-level Cloudinary media
      if (existing.mainImage && existing.mainImage.public_id) {
        await deleteFromCloudinary(existing.mainImage.public_id).catch((e) =>
          console.warn(
            "Failed to delete tour mainImage from Cloudinary:",
            e.message
          )
        );
      }
      if (Array.isArray(existing.galleryImages)) {
        for (const g of existing.galleryImages) {
          if (g && g.public_id) {
            await deleteFromCloudinary(g.public_id).catch((e) =>
              console.warn(
                "Failed to delete gallery image from Cloudinary:",
                e.message
              )
            );
          }
        }
      }

      // Find and delete related TourItems and their media
      const items = await TourItem.find({ tour: existing._id });
      for (const it of items) {
        if (it.mainImage && it.mainImage.public_id) {
          await deleteFromCloudinary(it.mainImage.public_id).catch((e) =>
            console.warn(
              `Failed to delete item ${it._id} mainImage:`,
              e.message
            )
          );
        }
        // audio may be stored as object with public_id or as url string
        if (
          it.audioUrl &&
          typeof it.audioUrl === "object" &&
          it.audioUrl.public_id
        ) {
          await deleteFromCloudinary(it.audioUrl.public_id).catch((e) =>
            console.warn(`Failed to delete item ${it._id} audio:`, e.message)
          );
        }
      }

      // Remove items and the tour document
      await TourItem.deleteMany({ tour: existing._id });
      await Tour.findByIdAndDelete(existing._id);
      console.log("Removed existing tour and its items.");
    } catch (err) {
      console.warn("Error while removing existing tour:", err.message);
      // continue — we'll attempt to create a fresh tour anyway
    }
  }

  const { main, gallery } = await uploadTourMedia();

  const tour = await Tour.create({
    name: mysticalGizaPyramidsTour.name,
    description: mysticalGizaPyramidsTour.description,
    price: mysticalGizaPyramidsTour.price,
    currency: mysticalGizaPyramidsTour.currency,
    itemsCount: mysticalGizaPyramidsTour.itemsCount,
    mainImage: main,
    galleryImages: gallery,
    place: place._id,
    guide: guide._id,
    difficulty: mysticalGizaPyramidsTour.difficulty,
    rating: mysticalGizaPyramidsTour.rating,
    ratingsCount: mysticalGizaPyramidsTour.ratingsCount,
    enrollmentsCount: mysticalGizaPyramidsTour.enrollmentsCount,
    isPublished: mysticalGizaPyramidsTour.isPublished,
    categories: mysticalGizaPyramidsTour.categories,
    tags: mysticalGizaPyramidsTour.tags,
    languages: mysticalGizaPyramidsTour.languages,
  });
  console.log("Created tour:", tour._id.toString());
  return tour;
}

async function uploadItemMedia(itemIdx, imgUrl, audioUrl) {
  const folder = `tours/giza/items`;
  const out = {};
  const cloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
  try {
    if (!cloudinaryConfigured) {
      out.mainImage = { url: imgUrl };
    } else {
      const imgBuf = await fetchBuffer(imgUrl);
      out.mainImage = await uploadStreamToCloudinary(imgBuf, folder);
    }
  } catch (e) {
    console.warn(`Item ${itemIdx} image upload failed`, e.message);
    out.mainImage = { url: imgUrl };
  }
  if (audioUrl) {
    try {
      if (!cloudinaryConfigured) {
        out.audioUrl = audioUrl;
      } else {
        const audioBuf = await fetchBuffer(audioUrl);
        out.audio = await uploadStreamToCloudinary(audioBuf, folder);
      }
    } catch (e) {
      console.warn(`Item ${itemIdx} audio upload failed`, e.message);
      out.audioUrl = audioUrl;
    }
  }
  return out;
}

async function createItems(tour) {
  const defs = buildItems();
  const items = [];
  let idx = 0;
  for (const d of defs) {
    idx += 1;
    const media = await uploadItemMedia(idx, d.img, d.audio);
    const [lng, lat] = d.location.coordinates;
    items.push({
      title: d.title,
      name: d.name,
      tour: tour._id,
      location: { type: "Point", coordinates: [lng, lat] },
      mainImage: media.mainImage,
      audioUrl: media.audio?.url || media.audioUrl,
      script: d.script || d.description || d.shortDescription,
      isPublished: true,
    });
  }
  const created = await TourItem.insertMany(items);
  console.log(`Created ${created.length} tour items`);

  const firstImages = created
    .slice(0, 6)
    .map((it) => ({ url: it.mainImage.url || it.mainImage }));
  await Tour.findByIdAndUpdate(tour._id, {
    itemsCount: created.length,
    mainImage: created[0]?.mainImage || tour.mainImage,
    galleryImages: firstImages,
  });
  console.log("Updated tour media from items");
}

async function main() {
  try {
    await connect();
    const place = await upsertPlace();
    const guide = await upsertGuide();
    const tour = await createTour(place, guide);

    const existingItems = await TourItem.countDocuments({ tour: tour._id });
    if (existingItems >= mysticalGizaPyramidsTour.itemsCount) {
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

// Run main when executed directly in Node (ES module compatible)
if (
  process.argv[1] &&
  process.argv[1].includes("seedMysticalGizaPyramids.js")
) {
  main();
}
