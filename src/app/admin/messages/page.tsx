import { requireAdmin } from "@/lib/admin";
import { MessagesInbox } from "@/components/admin/MessagesInbox";

export const metadata = { title: "Messages · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  await requireAdmin();
  return <MessagesInbox />;
}
