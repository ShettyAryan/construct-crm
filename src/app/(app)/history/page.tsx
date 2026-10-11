import { getHistory } from "@/lib/actions/history";
import { HistoryView } from "@/components/history/history-view";

export default async function HistoryPage() {
  const entries = await getHistory();
  return <HistoryView entries={entries} />;
}
