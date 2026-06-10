import { prisma } from "../lib/prisma";

async function run() {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error("Cloudinary credentials are not present in .env!");
      return;
    }

    const settings = await prisma.instituteSettings.findFirst();
    if (!settings) {
      console.error("No InstituteSettings record found in the database to update!");
      return;
    }

    await prisma.instituteSettings.update({
      where: { id: settings.id },
      data: {
        cloudinaryCloudName: cloudName,
        cloudinaryApiKey: apiKey,
        cloudinaryApiSecret: apiSecret,
      },
    });

    console.log("Successfully synchronized Cloudinary credentials from .env to the database!");
  } catch (error) {
    console.error("Failed to synchronize Cloudinary credentials:", error);
  }
}

run();
