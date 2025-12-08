import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import axios from "axios";
import { fileURLToPath } from "url";

// models + cloudinary utils
import Tour from "../src/models/tour.model.js";
import TourItem from "../src/models/tourItem.model.js";
import Place from "../src/models/place.model.js";
import User from "../src/models/user.model.js";
import {
  uploadToCloudinary,
  uploadStreamToCloudinary,
  deleteFromCloudinary,
} from "../src/utils/cloudinary.util.js";

// Load .env (tools/.env preferred, then repo root)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });
if (!process.env.MONGO_URI)
  dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/e-guide-dev";

const TOUR_ASSETS_DIR = path.resolve(__dirname, "tour 1");
const TARGET_GUIDE_EMAIL = "abdelrhmanosama298@gmail.com";
const TOUR_NAME = "Mystical Giza Pyramids & Sphinx Experience";
const DEFAULT_AUDIO =
  "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3";

// Titles, scripts, descriptions and locations provided by user for each item
const GIZA_TOUR_ITEMS = [
  {
    title: "Welcome to Giza Plateau",
    name: "Giza Plateau Entrance",
    description:
      "Welcome to the Giza Plateau, home to the last surviving wonder of the ancient world.",
    shortDescription: "Begin your journey at the main entrance",
    location: { type: "Point", coordinates: [31.132496, 29.979176] },
    script: `Welcome, traveler. You stand at the threshold of one of humanity's greatest achievements. Before you lies the Giza Plateau, home to the last surviving wonder of the ancient world. Take a moment to absorb the scale of what you're about to experience. The pyramids were built over 4,500 years ago, yet they continue to inspire awe and wonder.`,
  },
  {
    title: "The Great Pyramid of Khufu",
    name: "Khufu Pyramid",
    description: "The largest pyramid ever built, standing 146 meters tall.",
    shortDescription: "The Great Pyramid, tomb of Pharaoh Khufu",
    location: { type: "Point", coordinates: [31.134238, 29.979264] },
    script: `Behold the Great Pyramid of Khufu, also known as the Pyramid of Cheops. For over 3,800 years, this was the tallest man-made structure in the world. It consists of approximately 2.3 million stone blocks, each weighing an average of 2.5 tons. The precision of its construction still baffles engineers today.`,
  },
  {
    title: "Pyramid of Khafre",
    name: "Khafre Pyramid",
    description:
      "The second-largest pyramid, still retaining some of its original casing stones at the apex.",
    shortDescription: "Pyramid of Pharaoh Khafre with intact casing",
    location: { type: "Point", coordinates: [31.130827, 29.978006] },
    script: `This is the Pyramid of Khafre, son of Khufu. Although slightly smaller than his father's pyramid, it appears taller because it's built on higher ground. Look at the top - you can still see some of the original polished limestone casing stones that once covered the entire pyramid, making it shine brightly in the sun.`,
  },
  {
    title: "Pyramid of Menkaure",
    name: "Menkaure Pyramid",
    description:
      "The smallest of the three main pyramids, with three smaller queen's pyramids beside it.",
    shortDescription: "Smallest of the three main Giza pyramids",
    location: { type: "Point", coordinates: [31.128075, 29.973849] },
    script: `The Pyramid of Menkaure, grandson of Khufu, is the smallest of the three main pyramids. Notice the three smaller pyramids beside it - these were built for Menkaure's queens. The lower portion was originally covered in red granite from Aswan, while the upper part was limestone.`,
  },
  {
    title: "The Great Sphinx",
    name: "Sphinx of Giza",
    description:
      "The monumental limestone statue with the body of a lion and head of a human.",
    shortDescription: "Iconic Sphinx guarding the pyramids",
    location: { type: "Point", coordinates: [31.137605, 29.975312] },
    script: `Here stands the Great Sphinx, the largest monolith statue in the world. Carved from a single piece of limestone, it measures 73 meters long and 20 meters high. The face is believed to represent Pharaoh Khafre. For centuries, the Sphinx has guarded the Giza Plateau, its missing nose still a topic of debate among historians.`,
  },
  {
    title: "Sphinx Temple",
    name: "Valley Temple of Khafre",
    description:
      "The temple complex at the paws of the Sphinx, used for the mummification process.",
    shortDescription: "Temple complex at Sphinx paws",
    location: { type: "Point", coordinates: [31.137998, 29.975176] },
    script: `This is the Valley Temple of Khafre, located at the paws of the Sphinx. Here, priests performed the sacred rituals of mummification. The temple's walls are made of massive red granite blocks, some weighing over 100 tons. Notice how perfectly they fit together without mortar.`,
  },
  {
    title: "Solar Boat Museum",
    name: "Khufu Solar Boat",
    description:
      "Museum housing the reconstructed solar boat of Pharaoh Khufu.",
    shortDescription: "Ancient Egyptian solar boat",
    location: { type: "Point", coordinates: [31.134891, 29.979814] },
    script: `Inside this museum is one of the most remarkable archaeological discoveries - Khufu's solar boat. This 4,500-year-old cedarwood boat was buried in pieces near the Great Pyramid. Ancient Egyptians believed the pharaoh needed a boat to sail across the sky with the sun god Ra. It took 14 years to reassemble the 1,224 pieces.`,
  },
  {
    title: "Panoramic Viewpoint",
    name: "Giza Panorama Point",
    description: "The perfect spot to photograph all three pyramids together.",
    shortDescription: "Best photo spot for all three pyramids",
    location: { type: "Point", coordinates: [31.125456, 29.971234] },
    script: `This is the famous panoramic viewpoint. From here, you can see all three main pyramids aligned perfectly. Notice how they're positioned relative to the stars - the pyramids are aligned with the constellation Orion's Belt. This spot offers the classic Giza photo that has captivated travelers for centuries.`,
  },
  {
    title: "Queen's Pyramids",
    name: "G1a Pyramid",
    description: "The pyramids built for Khufu's queens and family members.",
    shortDescription: "Pyramids for royal queens",
    location: { type: "Point", coordinates: [31.135621, 29.980072] },
    script: `These smaller pyramids were built for Khufu's queens and family members. The largest, known as G1a, belonged to Queen Hetepheres. Although smaller than the main pyramids, they were still impressive structures with their own mortuary temples and burial chambers.`,
  },
  {
    title: "Workers' Cemetery",
    name: "Tomb Builders Village",
    description:
      "The burial site of the pyramid builders, showing they were skilled laborers, not slaves.",
    shortDescription: "Burial site of pyramid builders",
    location: { type: "Point", coordinates: [31.140123, 29.976543] },
    script: `Contrary to popular belief, the pyramids were built by skilled Egyptian workers, not slaves. This workers' cemetery contains the remains of laborers who died during construction. Their tombs and inscriptions show they took great pride in their work and were well-fed with meat, bread, and beer provided by the state.`,
  },
  {
    title: "Eastern Cemetery",
    name: "Mastaba Tombs",
    description:
      "The mastaba tombs of nobles and officials from the 4th Dynasty.",
    shortDescription: "Nobles' tombs near pyramids",
    location: { type: "Point", coordinates: [31.133456, 29.977891] },
    script: `These rectangular mastaba tombs belong to nobles and high officials who served the pharaohs. 'Mastaba' means 'bench' in Arabic, describing their shape. The walls are covered with inscriptions depicting daily life, offerings to the gods, and the deceased's journey to the afterlife.`,
  },
  {
    title: "Causeway of Khafre",
    name: "Khafre's Causeway",
    description:
      "The ancient processional road connecting the valley temple to the mortuary temple.",
    shortDescription: "Ancient processional road",
    location: { type: "Point", coordinates: [31.132567, 29.976543] },
    script: `This was Khafre's causeway, a covered corridor that connected his valley temple to his mortuary temple at the pyramid. During the funeral procession, the pharaoh's body would have been carried along this path. The walls were once decorated with reliefs showing the pharaoh's accomplishments.`,
  },
  {
    title: "Western Cemetery",
    name: "Giza West Field",
    description:
      "The largest cemetery at Giza, containing over 100 mastaba tombs.",
    shortDescription: "Largest cemetery at Giza",
    location: { type: "Point", coordinates: [31.131234, 29.978765] },
    script: `The Western Cemetery is the largest burial ground at Giza, containing tombs of royal family members and high officials. The most famous tomb here belongs to Queen Meresankh. Notice the different architectural styles - some have elaborate facades while others are more modest.`,
  },
  {
    title: "Sound & Light Show Area",
    name: "Sphinx Show Area",
    description:
      "The seating area for the famous Sound & Light show that illuminates the pyramids at night.",
    shortDescription: "Night show viewing area",
    location: { type: "Point", coordinates: [31.138765, 29.974321] },
    script: `At night, this area comes alive with the Sound & Light show. The pyramids and Sphinx are illuminated while a narration tells the story of ancient Egypt. The show has been running since 1961 and remains one of Egypt's most popular tourist attractions.`,
  },
  {
    title: "Camel Station",
    name: "Desert Camel Rides",
    description:
      "Traditional camel rides offering a unique perspective of the pyramids.",
    shortDescription: "Traditional camel ride starting point",
    location: { type: "Point", coordinates: [31.126543, 29.972109] },
    script: `For a traditional experience, you can take a camel ride through the desert. Camels have been used in Egypt for thousands of years and offer a unique perspective of the pyramids. From this elevated view, you can appreciate the sheer scale of these ancient monuments.`,
  },
  {
    title: "Modern Visitor Center",
    name: "Giza Information Center",
    description:
      "The main visitor center with exhibitions, maps, and information about the site.",
    shortDescription: "Main visitor information center",
    location: { type: "Point", coordinates: [31.132109, 29.975876] },
    script: `The visitor center provides essential information about the Giza Plateau. Here you'll find scale models, historical timelines, and information about ongoing archaeological work. The center also has facilities, a gift shop, and expert guides available for questions.`,
  },
  {
    title: "Khufu's Mortuary Temple",
    name: "Upper Temple of Khufu",
    description:
      "The temple where daily offerings were made to the deceased pharaoh's ka (soul).",
    shortDescription: "Temple for offerings to Khufu",
    location: { type: "Point", coordinates: [31.134876, 29.979012] },
    script: `This was Khufu's mortuary temple, where priests made daily offerings to sustain his ka in the afterlife. Although little remains today, it was once an elaborate complex with courtyards, storerooms, and statues. Offerings included food, drink, and incense to ensure the pharaoh's comfort in the next world.`,
  },
  {
    title: "Desert Plateau Edge",
    name: "Sahara Desert View",
    description: "The edge of the plateau overlooking the vast Sahara Desert.",
    shortDescription: "View of Sahara Desert from plateau",
    location: { type: "Point", coordinates: [31.124321, 29.970987] },
    script: `From this vantage point, you can see the vast expanse of the Sahara Desert. The pyramids were built at the boundary between the fertile Nile Valley and the desert. This location was symbolic - it represented the boundary between life (the fertile land) and death (the desert, where tombs were built).`,
  },
  {
    title: "Modern Cairo View",
    name: "City Skyline Viewpoint",
    description:
      "View of modern Cairo from the ancient plateau, showing the contrast of millennia.",
    shortDescription: "View of modern Cairo skyline",
    location: { type: "Point", coordinates: [31.139012, 29.973456] },
    script: `Look eastward and you'll see the skyline of modern Cairo. This view perfectly illustrates Egypt's continuity - ancient pyramids standing watch over a vibrant modern city of 20 million people. The pyramids have witnessed the rise and fall of dynasties, empires, and civilizations for 45 centuries.`,
  },
  {
    title: "Sunset Viewing Platform",
    name: "Golden Hour Giza",
    description:
      "The best spot to watch the sunset over the pyramids, when they glow with golden light.",
    shortDescription: "Best sunset viewing spot",
    location: { type: "Point", coordinates: [31.127654, 29.971098] },
    script: `As our tour concludes, watch the sunset paint the pyramids in golden light. This magical moment has inspired poets, artists, and travelers for millennia. The ancient Egyptians worshipped the sun god Ra, and seeing the pyramids at sunset gives you a sense of why the sun held such spiritual significance. Thank you for joining this journey through time.`,
  },
];

async function connect() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB:", MONGO_URI);
}

function localAsset(p) {
  const full = path.resolve(TOUR_ASSETS_DIR, p);
  return fs.existsSync(full) ? full : null;
}

async function upsertPlace() {
  let place = await Place.findOne({ name: "Giza Plateau" });
  if (!place) {
    place = await Place.create({
      name: "Giza Plateau",
      country: "Egypt",
      city: "Giza",
      category: "historical",
      description: "Giza Plateau - seed place",
      location: { type: "Point", coordinates: [31.132496, 29.979176] },
    });
    console.log("Created place", place._id.toString());
  } else console.log("Found place", place._id.toString());
  return place;
}

async function upsertGuide() {
  let guide = await User.findOne({ email: TARGET_GUIDE_EMAIL });
  if (!guide) {
    // generate unique phone
    const rand = Math.floor(Math.random() * 1e8)
      .toString()
      .padStart(8, "0");
    const phone = `10${rand}`;
    guide = await User.create({
      firstName: "Abdel",
      lastName: "Osama",
      email: TARGET_GUIDE_EMAIL,
      phone,
      role: "guide",
      password: "Password123!",
    });
    console.log("Created guide", guide._id.toString());
  } else console.log("Found guide", guide._id.toString());
  return guide;
}

async function removeExistingTour(guide) {
  const existing = await Tour.findOne({ name: TOUR_NAME, guide: guide._id });
  if (!existing) return;
  console.log("Removing existing tour", existing._id.toString());
  try {
    if (existing.mainImage?.public_id)
      await deleteFromCloudinary(existing.mainImage.public_id).catch(() => {});
    if (Array.isArray(existing.galleryImages)) {
      for (const g of existing.galleryImages)
        if (g?.public_id)
          await deleteFromCloudinary(g.public_id).catch(() => {});
    }
    const items = await TourItem.find({ tour: existing._id });
    for (const it of items) {
      if (it.mainImage?.public_id)
        await deleteFromCloudinary(it.mainImage.public_id).catch(() => {});
      if (it.audio?.public_id)
        await deleteFromCloudinary(it.audio.public_id).catch(() => {});
      if (Array.isArray(it.gallery))
        for (const gg of it.gallery)
          if (gg?.public_id)
            await deleteFromCloudinary(gg.public_id).catch(() => {});
    }
    await TourItem.deleteMany({ tour: existing._id });
    await Tour.findByIdAndDelete(existing._id);
    console.log("Removed existing tour and items");
  } catch (e) {
    console.warn("Error removing existing tour:", e.message);
  }
}

async function createTourAndItems(place, guide) {
  // Create tour
  const mainLocal = localAsset("main.jpg");
  const galleryFiles = [
    "gallery1.jpg",
    "gallery2.jpg",
    "1.jpg",
    "2.jpg",
    "3.jpg",
  ].map((f) => ({ url: localAsset(f) || f }));

  let mainImage = null;
  try {
    if (mainLocal) {
      const up = await uploadToCloudinary(mainLocal, "tours/giza");
      mainImage = { public_id: up.public_id, url: up.secure_url };
    } else {
      mainImage = {
        url: "https://picsum.photos/seed/giza/1600/900",
        public_id: "tours/giza-panorama",
      };
    }
  } catch (e) {
    console.warn("Main image upload failed:", e.message);
    mainImage = {
      url: mainLocal || "https://picsum.photos/seed/giza/1600/900",
    };
  }

  const gallery = [];
  for (const g of galleryFiles) {
    if (typeof g.url === "string" && fs.existsSync(g.url)) {
      try {
        const up = await uploadToCloudinary(g.url, "tours/giza");
        gallery.push({ public_id: up.public_id, url: up.secure_url });
      } catch (e) {
        console.warn("Gallery upload failed for", g.url, e.message);
        gallery.push({ url: g.url });
      }
    } else {
      // either non-local or missing => push as-is (may be remote URL)
      gallery.push({ url: g.url });
    }
  }

  const tour = await Tour.create({
    name: TOUR_NAME,
    description: "Giza tour seeded",
    price: 2500,
    currency: "EGP",
    itemsCount: 20,
    mainImage,
    galleryImages: gallery,
    place: place._id,
    guide: guide._id,
    difficulty: "moderate",
    isPublished: true,
  });
  console.log("Created tour", tour._id.toString());

  // Prepare audio candidates: prefer local mp3 files under TOUR_ASSETS_DIR, else fall back to curated URLs
  const localAudioFiles = (
    fs.existsSync(TOUR_ASSETS_DIR)
      ? fs
          .readdirSync(TOUR_ASSETS_DIR)
          .filter((f) => f.toLowerCase().endsWith(".mp3"))
      : []
  ).map((f) => path.resolve(TOUR_ASSETS_DIR, f));

  const fallbackAudioUrls = [
    "https://samplelib.com/lib/preview/mp3/sample-3s.mp3",
    "https://samplelib.com/lib/preview/mp3/sample-6s.mp3",
    "https://samplelib.com/lib/preview/mp3/sample-9s.mp3",
    "https://samplelib.com/lib/preview/mp3/sample-12s.mp3",
    "https://samplelib.com/lib/preview/mp3/sample-15s.mp3",
    "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3",
    "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
    "https://file-examples.com/wp-content/uploads/2017/11/file_example_MP3_700KB.mp3",
  ];

  // Helper: try to upload an audio source and ensure duration <= 30s. Returns uploaded object or null.
  async function findAndUploadShortAudio(candidateSources) {
    for (const src of candidateSources) {
      try {
        // If source looks like an mp3 file, request Cloudinary treat it as video (audio)
        const isMp3 =
          typeof src === "string" && src.toLowerCase().endsWith(".mp3");
        const up = await uploadToCloudinary(
          src,
          "tours/giza/items",
          isMp3 ? "video" : "auto"
        );
        console.log("Audio upload result:", {
          public_id: up.public_id,
          resource_type: up.resource_type,
          format: up.format,
          duration: up.duration,
          url: up.secure_url,
        });
        // Cloudinary returns duration for audio/video; if present and <=30 accept it
        if (up.duration === undefined || up.duration <= 30) {
          return {
            public_id: up.public_id,
            url: up.secure_url,
            duration: up.duration,
          };
        }
        // too long — delete and continue
        await deleteFromCloudinary(up.public_id).catch(() => {});
        console.warn(
          "Skipped audio (too long):",
          src,
          "duration=",
          up.duration
        );
      } catch (e) {
        console.warn("Audio upload attempt failed for", src, e.message);
      }
    }
    return null;
  }

  // TTS helper using VoiceRSS (free-ish) if API key provided. Truncates long scripts
  // to approximately fit <=30s (est. 150 wpm => 2.5 words/sec => ~75 words).
  async function synthesizeTextToMp3VoiceRss(text) {
    const key = "411b68a267124c77a1547f09bb701594";
    if (!key) return null;
    if (!text || typeof text !== "string") return null;

    // estimate words and truncate to ~75 words
    const words = text.split(/\s+/).filter(Boolean);
    const maxWords = 75; // approx 30s at normal speaking rate
    let clipped = text;
    if (words.length > maxWords) {
      clipped = words.slice(0, maxWords).join(" ") + "...";
    }

    try {
      const params = new URLSearchParams();
      params.append("key", key);
      params.append("hl", "en-us");
      params.append("src", clipped);
      params.append("c", "MP3");
      params.append("f", "44khz_16bit_stereo");

      const url = `https://api.voicerss.org/?${params.toString()}`;
      const resp = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 30000,
      });
      const buffer = Buffer.from(resp.data);

      // upload buffer to Cloudinary and return metadata (resource_type video for mp3)
      const up = await uploadStreamToCloudinary(
        buffer,
        "tours/giza/items",
        "video"
      );
      return up;
    } catch (e) {
      console.warn("TTS synthesis failed:", e.message);
      return null;
    }
  }

  // Create items using local numbered images 0.jpg..19.jpg
  const items = [];
  const audioLocalQueue = [...localAudioFiles];
  const usedAudioSources = new Set();

  for (let i = 0; i < 20; i++) {
    const imgLocal = localAsset(`${i}.jpg`);
    let mainImg = {
      url: imgLocal || `https://picsum.photos/seed/giza${i}/800/600`,
    };
    if (imgLocal) {
      try {
        const up = await uploadToCloudinary(imgLocal, "tours/giza/items");
        mainImg = { public_id: up.public_id, url: up.secure_url };
      } catch (e) {
        console.warn(`Item ${i} image upload failed:`, e.message);
      }
    }

    // Try TTS first (if configured)
    let audioObj = null;
    let sourceUsed = null;
    try {
      const ttsText =
        (GIZA_TOUR_ITEMS && GIZA_TOUR_ITEMS[i] && GIZA_TOUR_ITEMS[i].script) ||
        (GIZA_TOUR_ITEMS &&
          GIZA_TOUR_ITEMS[i] &&
          GIZA_TOUR_ITEMS[i].description) ||
        `Waypoint ${i + 1}`;
      const ttsUp = await synthesizeTextToMp3VoiceRss(ttsText);
      if (ttsUp) {
        audioObj = {
          public_id: ttsUp.public_id,
          url: ttsUp.url,
          duration: ttsUp.duration,
        };
        sourceUsed = audioObj.public_id || audioObj.url;
        usedAudioSources.add(sourceUsed);
        console.log(`TTS audio created for item ${i + 1}:`, sourceUsed);
      }
    } catch (e) {
      console.warn("TTS attempt failed:", e.message);
    }

    // If TTS didn't produce audio, fall back to previous candidate selection
    if (!audioObj) {
      // Build candidate audio sources: first any remaining local files, then fallbacks excluding used ones
      const candidates = [];
      if (audioLocalQueue.length) {
        const nextLocal = audioLocalQueue.shift();
        candidates.push(nextLocal);
      }
      for (const url of fallbackAudioUrls) {
        if (!usedAudioSources.has(url)) candidates.push(url);
      }

      // Try to find and upload a short audio (<=30s)
      audioObj = await findAndUploadShortAudio(candidates);
      if (audioObj) {
        sourceUsed = audioObj.public_id || audioObj.url;
        usedAudioSources.add(sourceUsed);
      } else {
        // fallback: upload DEFAULT_AUDIO (may be longer) and accept it
        try {
          const upa = await uploadToCloudinary(
            DEFAULT_AUDIO,
            "tours/giza/items"
          );
          audioObj = {
            public_id: upa.public_id,
            url: upa.secure_url,
            duration: upa.duration,
          };
          usedAudioSources.add(DEFAULT_AUDIO + String(i));
        } catch (e) {
          console.warn(
            `Item ${i} audio upload final fallback failed:`,
            e.message
          );
        }
      }
    }

    const meta = (GIZA_TOUR_ITEMS && GIZA_TOUR_ITEMS[i]) || {};
    const itemLocation =
      meta.location?.coordinates && meta.location?.type === "Point"
        ? { type: "Point", coordinates: meta.location.coordinates }
        : {
            type: "Point",
            coordinates: [31.13 + i * 0.001, 29.97 + i * 0.001],
          };

    items.push({
      title: meta.title || `Waypoint ${i + 1}`,
      name: meta.name || `waypoint-${i + 1}`,
      tour: tour._id,
      location: itemLocation,
      mainImage: mainImg,
      audio: audioObj || { url: DEFAULT_AUDIO },
      script: meta.script || `Description for waypoint ${i + 1}`,
      description: meta.description || undefined,
      shortDescription: meta.shortDescription || undefined,
      isPublished: true,
    });
  }

  const created = await TourItem.insertMany(items);
  console.log(`Created ${created.length} tour items`);

  await Tour.findByIdAndUpdate(tour._id, {
    itemsCount: created.length,
    mainImage: tour.mainImage,
  });

  return tour;
}

async function main() {
  try {
    await connect();
    const place = await upsertPlace();
    const guide = await upsertGuide();
    await removeExistingTour(guide);
    await createTourAndItems(place, guide);
    console.log("Seeding finished");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

if (process.argv[1] && process.argv[1].includes("seedMysticalGizaPyramids.js"))
  main();
