import { TasksView } from "@/components/tasks/tasks-view";
import { getTasks } from "@/lib/actions/tasks";

export default async function TasksPage() {
  const tasks = await getTasks();
  return <TasksView tasks={tasks} />;
}
