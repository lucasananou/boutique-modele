import { front } from "@/stores/current-front";

export default function VitrineNotFound() {
  if (!front) return null;
  const { NotFound } = front;
  return <NotFound />;
}
