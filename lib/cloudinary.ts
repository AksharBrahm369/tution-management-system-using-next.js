import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/lib/prisma";
import { Readable } from "stream";
import path from "path";

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export async function getCloudinaryConfig(): Promise<CloudinaryConfig | null> {
  const envCloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const envApiKey = process.env.CLOUDINARY_API_KEY;
  const envApiSecret = process.env.CLOUDINARY_API_SECRET;

  if (envCloudName && envApiKey && envApiSecret) {
    return {
      cloudName: envCloudName,
      apiKey: envApiKey,
      apiSecret: envApiSecret,
    };
  }

  // Fallback to database settings
  try {
    const settings = await prisma.instituteSettings.findFirst();
    if (
      settings?.cloudinaryCloudName &&
      settings?.cloudinaryApiKey &&
      settings?.cloudinaryApiSecret
    ) {
      return {
        cloudName: settings.cloudinaryCloudName,
        apiKey: settings.cloudinaryApiKey,
        apiSecret: settings.cloudinaryApiSecret,
      };
    }
  } catch (error) {
    console.error("Failed to read Cloudinary config from database:", error);
  }

  return null;
}

export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  folder: string
): Promise<{ url: string }> {
  const config = await getCloudinaryConfig();
  if (!config) {
    throw new Error("Cloudinary credentials are not configured.");
  }

  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });

  return new Promise((resolve, reject) => {
    const publicId = `${Date.now()}-${path.parse(filename).name.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "auto",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Upload failed"));
          return;
        }
        resolve({ url: result.secure_url });
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}
