import { notFound } from "next/navigation";
import MaterialsDashboardPage from "@/components/admin/materials/MaterialsDashboardPage";
import { getStandardById } from "@/lib/standards";
import { getCloudinaryConfig } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

export default async function StandardMaterialsPage({ params }: { params: Promise<{ standardId: string }> }) {
  const { standardId } = await params;
  const standard = await getStandardById(standardId);
  if (!standard) notFound();
  
  const cloudinaryConfig = await getCloudinaryConfig();
  const hasCloudinary = Boolean(cloudinaryConfig);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your-gemini-api-key-here");
  const isDev = process.env.NODE_ENV === "development";

  return (
    <MaterialsDashboardPage 
      standardId={standard.id} 
      standardName={standard.name} 
      basePath={`/admin/standards/${standard.id}/materials`}
      isCloudinaryConfigured={isDev ? true : hasCloudinary}
      isGeminiConfigured={hasGemini}
    />
  );
}
