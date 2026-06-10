import MaterialsDashboardPage from "@/components/admin/materials/MaterialsDashboardPage";
import { getCloudinaryConfig } from "@/lib/cloudinary";

export default async function AdminMaterialsPage() {
  const cloudinaryConfig = await getCloudinaryConfig();
  const hasCloudinary = Boolean(cloudinaryConfig);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your-gemini-api-key-here");
  const isDev = process.env.NODE_ENV === "development";

  return <MaterialsDashboardPage isCloudinaryConfigured={isDev ? true : hasCloudinary} isGeminiConfigured={hasGemini} />;
}