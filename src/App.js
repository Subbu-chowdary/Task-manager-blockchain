import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import TaskManagerABI from "./TaskManagerABI.json";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import "./index.css";

const contractAddress =
  process.env.REACT_APP_CONTRACT_ADDRESS ||
  "0x147f355376bf85c83721cedb6a552d4103f5fe2c";
const contractABI = TaskManagerABI.abi;

function App() {
  const [account, setAccount] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => {
    connectWallet();
    // Close modal when clicking outside
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const connectedAccount = await signer.getAddress();
        setAccount(connectedAccount);
        const contract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        window.contract = contract;
        await fetchTasks();
      } catch (error) {
        alert("Failed to connect wallet. See console for details.");
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const fetchTasks = async () => {
    if (!window.contract || !account) {
      setFetchError("Please connect your wallet to fetch tasks.");
      return;
    }
    setLoading(true);
    setFetchError(null);
    try {
      const tasksData = await window.contract.getTasks();
      const validTasks = tasksData.filter((task) => task);
      // Retrieve the stored order from localStorage
      const storedOrder = JSON.parse(localStorage.getItem("taskOrder")) || [];
      if (storedOrder.length === validTasks.length) {
        // Reorder tasks based on the stored order
        const orderedTasks = storedOrder.map((taskId) =>
          validTasks.find((task) => task.taskId.toString() === taskId)
        );
        setTasks(orderedTasks);
      } else {
        setTasks(validTasks); // Fallback to original order if lengths don't match
      }
    } catch (error) {
      setFetchError("Failed to fetch tasks. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Save the new order to localStorage
    const newOrder = items.map((task) => task.taskId.toString());
    localStorage.setItem("taskOrder", JSON.stringify(newOrder));

    setTasks(items);
  };

  const handleCreateOrUpdateTask = async () => {
    if (!title.trim() || !description.trim())
      return alert("Title and Description cannot be empty!");
    setLoading(true);
    try {
      const tx = editingTaskId
        ? await window.contract.updateTask(
            editingTaskId,
            title,
            description,
            status
          )
        : await window.contract.createTask(title, description);
      await tx.wait();
      setOpen(false);
      setTitle("");
      setDescription("");
      setStatus(false);
      setEditingTaskId(null);
      await fetchTasks();
      alert("Task processed successfully!");
    } catch (error) {
      alert("An error occurred. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = (task) => {
    setTitle(task.title);
    setDescription(task.description);
    setStatus(task.status);
    setEditingTaskId(task.taskId.toString());
    setOpen(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (window.contract) {
      try {
        const tx = await window.contract.deleteTask(taskId.toString());
        await tx.wait();
        await fetchTasks();
        alert("Task deleted successfully!");
      } catch (error) {
        alert("Failed to delete task. Check console for details.");
      }
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <div className="max-w-6xl mx-auto p-5">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold ">Task Manager</h1>
          <div className="flex items-center gap-3">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              onClick={connectWallet}
            >
              {account
                ? `${account.slice(0, 6)}...${account.slice(-4)}`
                : "Connect Wallet"}
            </button>
            <label className="dark-mode-toggle flex items-center">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
                className="toggle-input"
              />
              <span className="toggle-slider"></span>
              <span className="ml-2 text-sm font-medium text-gray-600 dark:text-white">
                {darkMode ? "Dark" : "Light"}
              </span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-3">
          <button
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 dark:bg-red-400 dark:hover:bg-red-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={() => setOpen(true)}
            disabled={loading}
          >
            {loading ? "Adding..." : "Add Task"}
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={fetchTasks}
            disabled={loading}
          >
            Refresh Tasks
          </button>
          {fetchError && <p className="text-red-500 mt-2">{fetchError}</p>}
        </div>

        {/* Task List */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="tasks">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {tasks.length === 0 ? (
                  <p className="text-gray-500 ">
                    No tasks found for this account.
                  </p>
                ) : (
                  tasks.map((task, index) => (
                    <Draggable
                      key={task.taskId.toString()}
                      draggableId={task.taskId.toString()}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`p-3 rounded-lg shadow-sm mb-3 flex justify-between items-center transition-all hover:-translate-y-0.5 hover:shadow-md border ${
                            darkMode
                              ? "bg-black text-white border-gray-600"
                              : "bg-white text-black border-gray-300"
                          }`}
                        >
                          <div>
                            <h2 className="text-lg text-gray-900 ">
                              {task.title}
                            </h2>
                            <p className="text-sm text-gray-500 ">
                              {task.description}
                            </p>
                            <p
                              className={`text-sm font-medium ${
                                task.status
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              Status: {task.status ? "Completed" : "Pending"}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-500 transition-colors"
                              onClick={() => handleEditTask(task)}
                            >
                              Edit
                            </button>
                            <button
                              className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 dark:bg-red-400 dark:hover:bg-red-500 transition-colors"
                              onClick={() =>
                                handleDeleteTask(task.taskId.toString())
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Modal */}
        {open && (
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
            <div
              className="bg-white dark:bg-gray-800 p-6 rounded-xl w-11/12 max-w-md shadow-lg transition-all"
              ref={modalRef}
            >
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                {editingTaskId ? "Edit Task" : "Add Task"}
              </h2>
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="p-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-blue-400 transition-all"
                />
                <textarea
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="p-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:border-blue-400 transition-all"
                />
                <label className="flex items-center text-gray-600 dark:text-white">
                  <input
                    type="checkbox"
                    checked={status}
                    onChange={(e) => setStatus(e.target.checked)}
                    className="mr-2"
                  />
                  Completed
                </label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:bg-blue-400 dark:hover:bg-blue-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  onClick={handleCreateOrUpdateTask}
                  disabled={loading}
                >
                  {loading
                    ? "Processing..."
                    : editingTaskId
                    ? "Update"
                    : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
