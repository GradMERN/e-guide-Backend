import mongoose from "mongoose";

const connectDB = async () => {
<<<<<<< Updated upstream
  await mongoose.connect(process.env.MONGO_URI);
=======
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1); // exit the app if DB connection fails
  }
>>>>>>> Stashed changes
};

export default connectDB;
