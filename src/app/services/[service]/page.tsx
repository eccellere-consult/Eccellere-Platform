import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { servicesData, getAllServiceSlugs } from "@/lib/services-data";
import { assets } from "@/lib/marketplace-data";
import { ServicePageContent } from "@/components/services/ServicePageContent";

export function generateStaticParams() {
  return getAllServiceSlugs().map((slug) => ({ service: slug }));
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ service: string }>;
}) {
  const { service: serviceSlug } = await params;
  const service = servicesData.find((s) => s.slug === serviceSlug);
  if (!service) notFound();

  const relatedAssets = assets.filter((a) =>
    service.relatedAssetSlugs.includes(a.slug)
  );

  return (
    <>
      <Header />
      <ServicePageContent service={service} relatedAssets={relatedAssets} />
      <Footer />
    </>
  );
}
