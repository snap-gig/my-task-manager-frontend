import React, { useState, useEffect } from "react";
import axios from "axios";
import { Task, Status, Board } from "./types";
import { Column } from "./components/Column";
import { TaskModal } from "./components/TaskModal";
import { Layout, Plus } from "lucide-react";

const boardId = "32c69b32-b687-491b-80f4-43ce74dd0449";

function App() {
  const [boards, setBoards] = useState<Board[]>([
    { id: "1", name: "Main Board", tasks: [] },
  ]);
  const [currentBoard, setCurrentBoard] = useState<Board>(boards[0]);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [newTaskStatus, setNewTaskStatus] = useState<Status | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasksByStatus = async (status: Status) => {
    try {
      const response = await axios.get(
        `https://62ff-2405-201-402e-e0c4-addd-f191-1e31-6522.ngrok-free.app/api/tasks/board/${boardId}/status/${status}`
      );
      console.log(`Fetched ${status} tasks:`, response.data);
      return response.data.data;
    } catch (err) {
      console.error(`Failed to fetch ${status} tasks:`, err);
      return [];
    }
  };

  const fetchAllTasks = async () => {
    try {
      const [todoTasks, doingTasks, doneTasks] = await Promise.all([
        fetchTasksByStatus("TODO"),
        fetchTasksByStatus("IN_PROGRESS"),
        fetchTasksByStatus("DONE"),
      ]);

      const allTasks = [...todoTasks, ...doingTasks, ...doneTasks];
      const updatedBoard = { ...currentBoard, tasks: allTasks };
      setBoards([updatedBoard]);
      setCurrentBoard(updatedBoard);
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch tasks");
      setLoading(false);
      console.error("Error fetching tasks:", err);
    }
  };

  useEffect(() => {
    fetchAllTasks();
  }, []);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData("taskId", task.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    try {
      await axios.put(
        `https://62ff-2405-201-402e-e0c4-addd-f191-1e31-6522.ngrok-free.app/api/tasks/${taskId}`,
        { status }
      );
      await fetchAllTasks();
    } catch (err) {
      console.error("Failed to update task status:", err);
      setError("Failed to update task status");
    }
  };

  const handleAddTask = (status: Status) => {
    setNewTaskStatus(status);
    setEditingTask(undefined);
  };

  const handleSaveTask = async (taskData: Omit<Task, "id">) => {
    try {
      if (editingTask) {
        await axios.put(
          `https://62ff-2405-201-402e-e0c4-addd-f191-1e31-6522.ngrok-free.app/api/tasks/${editingTask.id}`,
          {
            title: taskData.title,
            description: taskData.description, // Note: API expects 'discription' not 'description'
            status: taskData.status,
          }
        );
      } else {
        // const newTaskId = Math.random().toString(36).substr(2, 9);
        await axios.post(
          "https://62ff-2405-201-402e-e0c4-addd-f191-1e31-6522.ngrok-free.app/api/tasks",
          {
            // id: newTaskId,
            title: taskData.title,
            description: taskData.description, // Note: API expects 'discription' not 'description'
            status: taskData.status,
            boardId: boardId,
          }
        );
      }
      await fetchAllTasks();
      setEditingTask(undefined);
      setNewTaskStatus(undefined);
    } catch (err) {
      console.error("Failed to save task:", err);
      setError(editingTask ? "Failed to update task" : "Failed to create task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await axios.delete(
        `https://62ff-2405-201-402e-e0c4-addd-f191-1e31-6522.ngrok-free.app/api/tasks/${taskId}`
      );
      await fetchAllTasks();
    } catch (err) {
      console.error("Failed to delete task:", err);
      setError("Failed to delete task");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Layout className="h-6 w-6 text-blue-600" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900">
                {currentBoard.name}
              </h1>
            </div>
            <button
              onClick={() => handleAddTask("TODO")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Task
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(["TODO", "IN_PROGRESS", "DONE"] as Status[]).map((status) => (
            <Column
              key={status}
              title={status}
              status={status}
              tasks={currentBoard.tasks.filter(
                (task) => task.status === status
              )}
              onAddTask={handleAddTask}
              onEditTask={setEditingTask}
              onDeleteTask={handleDeleteTask}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          ))}
        </div>
      </main>

      {(editingTask || newTaskStatus) && (
        <TaskModal
          task={editingTask}
          status={newTaskStatus}
          onClose={() => {
            setEditingTask(undefined);
            setNewTaskStatus(undefined);
          }}
          onSave={handleSaveTask}
        />
      )}
    </div>
  );
}

export default App;
