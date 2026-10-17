import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { front } from "@/stores/current-front";
import type { SearchParams } from "@/stores/front";

// Pages servies à la demande : prix, stock et compte viennent de la base.
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { path = [] } = await params;
  return front?.resolve(path)?.metadata ?? {};
}

export default async function VitrinePage({ params, searchParams }: Props) {
  const { path = [] } = await params;
  const route = front?.resolve(path);
  if (!route) notFound();
  return route.render({ searchParams: await searchParams });
}
