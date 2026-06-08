import MaterialsDashboardPage from "@/components/admin/materials/MaterialsDashboardPage";

export default function AdminMaterialsPage() {
  const hasCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your-gemini-api-key-here");

  return <MaterialsDashboardPage isCloudinaryConfigured={hasCloudinary} isGeminiConfigured={hasGemini} />;
}