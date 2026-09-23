import { ChatPageClient } from "@/components/chat/ChatPageClient";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { documentId } = await params;
  return <ChatPageClient documentId={documentId} />;
}
