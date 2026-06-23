import MaterialsDashboardPage from "@/components/admin/materials/MaterialsDashboardPage";
import { getCloudinaryConfig, getMissingCloudinaryVars } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export default async function AdminMaterialsPage() {
  const cloudinaryConfig = await getCloudinaryConfig();
  const missingCloudinaryVars = getMissingCloudinaryVars();
  const hasCloudinary = Boolean(cloudinaryConfig) && missingCloudinaryVars.length === 0;
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your-gemini-api-key-here");

  return (
    <MaterialsDashboardPage 
      isCloudinaryConfigured={hasCloudinary} 
      missingCloudinaryVars={missingCloudinaryVars}
      isGeminiConfigured={hasGemini} 
    />
  );
}