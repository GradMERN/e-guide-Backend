import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

function configureCloudinary() {
  // Configure Cloudinary from environment variables at runtime.
  // This allows dotenv to load before configuration even if this module is imported early.
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    process.env;
  if (CLOUDINARY_CLOUD_NAME || CLOUDINARY_API_KEY || CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
    });
  }
}

export const uploadToCloudinary = async (
  filePath,
  folder = "uploads",
  resourceType = "auto"
) => {
  configureCloudinary();
  return await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: resourceType,
  });
};

export const uploadStreamToCloudinary = async (
  buffer,
  folder = "uploads",
  resourceType = "auto"
) => {
  configureCloudinary();
  return await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);

        const out = {
          public_id: result.public_id,
          url: result.secure_url,
        };
        // include duration when available (audio/video)
        if (result.duration !== undefined) out.duration = result.duration;

        resolve(out);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  configureCloudinary();
  return await cloudinary.uploader.destroy(publicId);
};
