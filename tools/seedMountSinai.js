import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// models + cloudinary utils
import Tour from "../src/models/tour.model.js";
import TourItem from "../src/models/tourItem.model.js";
import Place from "../src/models/place.model.js";
import User from "../src/models/user.model.js";
import {
  uploadToCloudinary,
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

const TOUR_ASSETS_DIR = path.resolve(__dirname, "tour 2");
const TARGET_GUIDE_EMAIL = "ahmed.khaled@gmail.com";
const TOUR_NAME = "Mount Sinai Pilgrimage & Sunrise Experience";
const DEFAULT_AUDIO =
  "https://www.learningcontainer.com/wp-content/uploads/2020/02/Kalimba.mp3";

// Mount Sinai tour items (20). Coordinates use [lng, lat] GeoJSON order.
const SINAI_TOUR_ITEMS = [
  {
    title: "St. Catherine Visitor Center",
    name: "St Catherine Visitor Center",
    description:
      "The starting point for your pilgrimage, with exhibits and orientation.",
    shortDescription: "Visitor orientation and exhibits",
    location: { type: "Point", coordinates: [34.0185, 28.556] },
    script: `Welcome to the St. Catherine Visitor Center. Here you will receive orientation about the preserve, maps for the ascent, and information on safety and local traditions. Take a moment to prepare for the spiritual and natural journey ahead.`,
  },
  {
    title: "Monastery of Saint Catherine",
    name: "Saint Catherine Monastery",
    description:
      "An ancient monastery at the foot of Mount Sinai, home to priceless manuscripts.",
    shortDescription: "Historic monastery and libraries",
    location: { type: "Point", coordinates: [34.0167, 28.5578] },
    script: `The Monastery of Saint Catherine is one of the oldest Christian monasteries in the world. Its library holds an incredible collection of manuscripts and icons. Respectful silence is appreciated while touring the sacred spaces.`,
  },
  {
    title: "Footpath to the Mountain",
    name: "Ascent Trailhead",
    description:
      "The well-trodden path that leads up toward the mountain ascent.",
    shortDescription: "Trailhead for the ascent",
    location: { type: "Point", coordinates: [34.0208, 28.5532] },
    script: `From this trailhead the path begins to wind upwards. The terrain changes from arid plateaus to rocky switchbacks. Keep water and sun protection handy as you start the climb.`,
  },
  {
    title: "Ancient Bedrock",
    name: "Bedrock Outcrop",
    description:
      "Exposed ancient rocks that tell the geological history of Sinai.",
    shortDescription: "Geological formations and views",
    location: { type: "Point", coordinates: [34.024, 28.5495] },
    script: `These bedrock formations are millions of years old. As you climb, notice the layers and colors of the rock — they record the long geological history of the peninsula.`,
  },
  {
    title: "Resting Groves",
    name: "Resting Groves",
    description:
      "Shaded spots used historically by pilgrims for rest and reflection.",
    shortDescription: "Historic rest stops",
    location: { type: "Point", coordinates: [34.0273, 28.546] },
    script: `Pilgrims over centuries have paused here to rest and reflect. The sparse vegetation and shade offer a welcome respite on warmer days. Use these stops to acclimatize and hydrate.`,
  },
  {
    title: "Ancient Steps",
    name: "Stone Steps",
    description:
      "Sections of carved stone steps thought to be used by earlier travelers.",
    shortDescription: "Historic stone steps",
    location: { type: "Point", coordinates: [34.0301, 28.5431] },
    script: `These stone steps appear to be ancient. They remind us of the many hands that shaped this route. Pause and imagine earlier travelers making their way upward.`,
  },
  {
    title: "Sinai Gorge View",
    name: "Gorge Overlook",
    description: "A dramatic overlook into a deep gorge carved over millennia.",
    shortDescription: "Dramatic gorge outlook",
    location: { type: "Point", coordinates: [34.0345, 28.5402] },
    script: `From this viewpoint you can see the deep gorges that cut through the landscape. The contrast between the canyon's depth and the plateau is striking at sunrise and sunset.`,
  },
  {
    title: "Hermit's Caves",
    name: "Hermit Caves",
    description: "Small caves where early ascetics sought solitude and prayer.",
    shortDescription: "Caves used by ancient hermits",
    location: { type: "Point", coordinates: [34.0379, 28.5378] },
    script: `These small caves provided shelter for ascetics and hermits who sought solitude. The spiritual history here is palpable — many still leave small offerings as tokens of reverence.`,
  },
  {
    title: "Midpoint Plateau",
    name: "Halfway Plateau",
    description: "A wide plateau area ideal for rest and panoramic photos.",
    shortDescription: "Plateau with panoramic views",
    location: { type: "Point", coordinates: [34.0412, 28.5346] },
    script: `This plateau marks a good halfway point on the ascent. From here you can see both the starting valley and the higher ridgelines that lead to the summit. It's a great spot for photos and to catch your breath.`,
  },
  {
    title: "Rose Quartz Ridge",
    name: "Pink Ridge",
    description: "A section of rock with warm pink hues at golden hour.",
    shortDescription: "Colorful rocks at sunset",
    location: { type: "Point", coordinates: [34.0448, 28.5317] },
    script: `In late afternoon the rocks here take on warm pink and rose tones. The minerals and weathering patterns create a beautiful palette that many photographers love.`,
  },
  {
    title: "Sunrise Ridge",
    name: "Sunrise Ridge",
    description:
      "A favored spot to watch the sun rise above the Sinai horizon.",
    shortDescription: "Sunrise viewpoint",
    location: { type: "Point", coordinates: [34.0486, 28.5291] },
    script: `This ridge is famous for sunrise. Many pilgrims time their ascent to arrive before dawn and witness the sun illuminate the desert — a moving spiritual and visual experience.`,
  },
  {
    title: "Moses' Viewpoint",
    name: "Prophet's Overlook",
    description:
      "A viewpoint traditionally associated with the biblical story of Moses receiving revelation.",
    shortDescription: "Historic/religious viewpoint",
    location: { type: "Point", coordinates: [34.0519, 28.5263] },
    script: `Local tradition points to this area as a place associated with the life of Moses. Whether taken literally or symbolically, the view here invites contemplation and reverence.`,
  },
  {
    title: "Pilgrim's Rest",
    name: "Pilgrim Shelter",
    description: "A small stone shelter used by pilgrims to pray and rest.",
    shortDescription: "Shelter for pilgrims",
    location: { type: "Point", coordinates: [34.0543, 28.5237] },
    script: `This small stone shelter has been a place of prayer and rest for generations. Visitors often leave notes or tokens of thanks here. Please be respectful of objects left by others.`,
  },
  {
    title: "Summit Pass",
    name: "Summit Pass",
    description:
      "The last stretch before the summit with narrow paths and sweeping views.",
    shortDescription: "Final ascent stretch",
    location: { type: "Point", coordinates: [34.0578, 28.5208] },
    script: `This is the final pass before the summit. The path can be narrow and steep; take care with footing and go at a comfortable pace. The views reward the effort.`,
  },
  {
    title: "Mount Sinai Summit",
    name: "Mount Sinai Summit",
    description:
      "The summit plateau, a place of awe with 360° views across Sinai.",
    shortDescription: "Summit with panoramic views",
    location: { type: "Point", coordinates: [34.0605, 28.5181] },
    script: `You've reached the summit of Mount Sinai. From here the panorama stretches across the Sinai Peninsula to the Red Sea in the distance. Many visitors come here for sunrise, reflection, and a profound sense of place.`,
  },
  {
    title: "Summit Cairn",
    name: "Summit Cairn",
    description:
      "A stone cairn marking the high point, often used as a place for offerings.",
    shortDescription: "Cairn marking the summit",
    location: { type: "Point", coordinates: [34.061, 28.5176] },
    script: `This cairn marks the summit and is often the focus of quiet rituals or offerings. If you add a stone, please be mindful of local custom and environmental impact.`,
  },
  {
    title: "Holy Spring",
    name: "Summit Spring",
    description: "A small spring near the summit revered for its cool water.",
    shortDescription: "Natural spring near summit",
    location: { type: "Point", coordinates: [34.0588, 28.5194] },
    script: `This small spring is a welcome source of cool water near the summit. Historically, springs like this are considered sacred by many visitors. Please use water sparingly and leave no trace.`,
  },
  {
    title: "Downward Path",
    name: "Descent Trail",
    description:
      "Scenic descent path with different light and vistas than the ascent.",
    shortDescription: "Trail for descent",
    location: { type: "Point", coordinates: [34.0562, 28.522] },
    script: `The descent offers new perspectives on the landscape you ascended. Rocks and shadows reveal different colors and textures in the afternoon light. Take your time and enjoy the changing views.`,
  },
  {
    title: "Saint Catherine's Oasis",
    name: "Oasis Return",
    description:
      "A small oasis area near the monastery where many end their pilgrimage.",
    shortDescription: "Oasis near monastery",
    location: { type: "Point", coordinates: [34.0189, 28.5584] },
    script: `As you return, this oasis offers shade and rest. It is a peaceful spot to conclude your pilgrimage, reflect on the journey, and rehydrate.`,
  },
  {
    title: "Local Craft Market",
    name: "Market Lane",
    description: "Small stalls offering local crafts, textiles, and souvenirs.",
    shortDescription: "Local craft stalls",
    location: { type: "Point", coordinates: [34.0175, 28.5595] },
    script: `Before you leave, consider browsing the local craft stalls. Purchasing local handicrafts supports the community and provides a meaningful memento of your journey.`,
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
  let place = await Place.findOne({ name: "Mount Sinai" });
  if (!place) {
    place = await Place.create({
      name: "Mount Sinai",
      country: "Egypt",
      city: "Sinai",
      category: "historical",
      description: "Mount Sinai - seed place",
      location: { type: "Point", coordinates: [34.0195, 28.5394] },
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
      firstName: "Ahmed",
      lastName: "El-Sayed",
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
      const up = await uploadToCloudinary(mainLocal, "tours/sinai");
      mainImage = { public_id: up.public_id, url: up.secure_url };
    } else {
      mainImage = {
        url: "https://picsum.photos/seed/sinai/1600/900",
        public_id: "tours/sinai-panorama",
      };
    }
  } catch (e) {
    console.warn("Main image upload failed:", e.message);
    mainImage = {
      url: mainLocal || "https://picsum.photos/seed/sinai/1600/900",
    };
  }

  const gallery = [];
  for (const g of galleryFiles) {
    if (typeof g.url === "string" && fs.existsSync(g.url)) {
      try {
        const up = await uploadToCloudinary(g.url, "tours/sinai");
        gallery.push({ public_id: up.public_id, url: up.secure_url });
      } catch (e) {
        console.warn("Gallery upload failed for", g.url, e.message);
        gallery.push({ url: g.url });
      }
    } else {
      gallery.push({ url: g.url });
    }
  }

  const tour = await Tour.create({
    name: TOUR_NAME,
    description:
      "Experience the spiritual and natural beauty of Mount Sinai. This guided pilgrimage combines history, stunning vistas, and a profound sunrise experience.",
    price: 350,
    currency: "EGP",
    itemsCount: SINAI_TOUR_ITEMS.length,
    mainImage,
    galleryImages: gallery,
    place: place._id,
    guide: guide._id,
    difficulty: "moderate",
    isPublished: true,
    rating: 4,
    ratingsCount: 0,
    enrollmentsCount: 0,
    categories: ["Religious", "Hiking", "Cultural", "Sunrise", "Day Tour"],
    tags: ["Mount Sinai", "Pilgrimage", "Sunrise", "Monastery"],
    languages: ["English", "Arabic", "French"],
  });
  console.log("Created tour", tour._id.toString());

  // Prepare local audio discovery (reuse logic from other seeder)
  function collectLocalAudioFiles(dir) {
    const exts = [
      ".mp3",
      ".m4a",
      ".wav",
      ".ogg",
      ".aac",
      ".flac",
      ".webm",
      ".mp4",
      ".m4b",
    ];
    const results = [];
    if (!fs.existsSync(dir)) return results;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const it of items) {
      const full = path.resolve(dir, it.name);
      if (it.isDirectory()) {
        results.push(...collectLocalAudioFiles(full));
      } else {
        const lname = it.name.toLowerCase();
        if (exts.some((e) => lname.endsWith(e))) results.push(full);
      }
    }
    return results;
  }

  const numbered = [];
  for (let n = 0; n < SINAI_TOUR_ITEMS.length; n++) {
    const p = path.resolve(TOUR_ASSETS_DIR, `${n}.mp3`);
    if (fs.existsSync(p)) numbered.push(p);
  }
  let localAudioFiles = [];
  const allFound = collectLocalAudioFiles(TOUR_ASSETS_DIR);
  if (numbered.length === SINAI_TOUR_ITEMS.length) {
    localAudioFiles = numbered;
  } else if (numbered.length > 0) {
    localAudioFiles = [
      ...numbered,
      ...allFound.filter((f) => !numbered.includes(f)),
    ];
  } else {
    localAudioFiles = allFound;
  }

  const fallbackAudioUrls = [
    "https://samplelib.com/lib/preview/mp3/sample-3s.mp3",
    "https://samplelib.com/lib/preview/mp3/sample-6s.mp3",
    DEFAULT_AUDIO,
  ];

  async function findAndUploadShortAudio(candidateSources) {
    const preferredVideoLikeExts = [".mp3", ".m4a", ".mp4", ".webm"];
    for (const src of candidateSources) {
      try {
        let ext = "";
        try {
          ext = path
            .extname(typeof src === "string" ? src.split(/[?#]/)[0] : "")
            .toLowerCase();
        } catch (e) {
          ext = "";
        }
        const resourceType = preferredVideoLikeExts.includes(ext)
          ? "video"
          : "auto";

        const up = await uploadToCloudinary(
          src,
          "tours/sinai/items",
          resourceType
        );
        console.log("Audio upload result:", {
          public_id: up.public_id,
          resource_type: up.resource_type,
          format: up.format,
          duration: up.duration,
          url: up.secure_url,
        });
        // Accept any successfully uploaded audio regardless of its duration
        return {
          public_id: up.public_id,
          url: up.secure_url,
          duration: up.duration,
        };
      } catch (e) {
        console.warn("Audio upload attempt failed for", src, e.message);
      }
    }
    return null;
  }

  // Create items by mapping SINAI_TOUR_ITEMS and attaching images/audio where available
  const items = [];
  const audioLocalQueue = [...localAudioFiles];
  const usedAudioSources = new Set();

  for (let i = 0; i < SINAI_TOUR_ITEMS.length; i++) {
    const meta = SINAI_TOUR_ITEMS[i] || {};
    const imgLocal = localAsset(`${i}.jpg`);
    let mainImg = {
      url: imgLocal || `https://picsum.photos/seed/sinai${i}/800/600`,
    };
    if (imgLocal) {
      try {
        const up = await uploadToCloudinary(imgLocal, "tours/sinai/items");
        mainImg = { public_id: up.public_id, url: up.secure_url };
      } catch (e) {
        console.warn(`Item ${i} image upload failed:`, e.message);
      }
    }

    const candidates = [];
    if (audioLocalQueue.length) candidates.push(audioLocalQueue.shift());
    for (const url of fallbackAudioUrls)
      if (!usedAudioSources.has(url)) candidates.push(url);

    let audioObj = await findAndUploadShortAudio(candidates);
    if (audioObj) usedAudioSources.add(audioObj.public_id || audioObj.url);
    else {
      try {
        const upa = await uploadToCloudinary(
          DEFAULT_AUDIO,
          "tours/sinai/items"
        );
        audioObj = {
          public_id: upa.public_id,
          url: upa.secure_url,
          duration: upa.duration,
        };
      } catch (e) {
        console.warn(
          `Item ${i} audio upload final fallback failed:`,
          e.message
        );
      }
    }

    const itemLocation =
      meta.location?.coordinates && meta.location?.type === "Point"
        ? { type: "Point", coordinates: meta.location.coordinates }
        : {
            type: "Point",
            coordinates: [34.0195 + i * 0.001, 28.5394 + i * 0.001],
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

if (process.argv[1] && process.argv[1].includes("seedMountSinai.js")) main();
