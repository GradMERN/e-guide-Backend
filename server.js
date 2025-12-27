import dotenv from "dotenv";
import app from "./src/app.js";
import defaultAdmin from "./src/utils/default-admin.utils.js";
import connectDB from "./src/config/database.config.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    console.log("MongoDB Connected Successfully");
  app.listen(PORT, "0.0.0.0", () => {
    defaultAdmin();
    console.log(`Server running on port ${PORT}`);
  });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  });
