import { notFound } from "next/navigation";
import MaterialsDashboardPage from "@/components/admin/materials/MaterialsDashboardPage";
import { getStandardById } from "@/lib/standards";

export default async function StandardMaterialsPage({ params }: { params: Promise<{ standardId: string }> }) {
  const { standardId } = await params;
  const standard = await getStandardById(standardId);
  if (!standard) notFound();
  const hasCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your-gemini-api-key-here");

  return (
    <MaterialsDashboardPage 
      standardId={standard.id} 
      standardName={standard.name} 
      basePath={`/admin/standards/${standard.id}/materials`}
      isCloudinaryConfigured={hasCloudinary}
      isGeminiConfigured={hasGemini}
    />
  );
}
