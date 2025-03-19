import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import TaskManagerABI from "./TaskManagerABI.json";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Switch,
  FormControlLabel,
} from "@material-ui/core";
import Slide from "@material-ui/core/Slide";
import "./index.css";

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS; // Updated with full address
const contractABI = TaskManagerABI.abi;

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

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

  useEffect(() => {
    connectWallet();
  }, []);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const connectedAccount = await signer.getAddress();
        setAccount(connectedAccount);
        console.log("Connected account from MetaMask:", connectedAccount);
        const contract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        window.contract = contract;
        console.log("Contract initialized at:", contractAddress);
        await fetchTasks(); // Fetch tasks after connecting
      } catch (error) {
        console.error("Wallet connection error:", error);
        alert(
          "Failed to connect wallet. Ensure MetaMask is on Sepolia and funded. See console for details."
        );
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const fetchTasks = async () => {
    if (!window.contract || !account) {
      console.log("Contract or account not initialized. Connect wallet first.");
      setFetchError("Please connect your wallet to fetch tasks.");
      return;
    }
    setLoading(true);
    setFetchError(null);
    try {
      console.log("Fetching tasks for account:", account);
      const tasksData = await window.contract.getTasks();
      console.log("Raw tasks data from contract (unfiltered):", tasksData);
      // Log each task for debugging
      tasksData.forEach((task, index) => {
        console.log(`Task ${index}:`, task);
      });
      // Minimal filtering to avoid losing data during debug
      const validTasks = tasksData.filter(
        (task) => task && task.taskId !== undefined && task.title !== undefined
      );
      console.log("Filtered tasks for account:", validTasks);
      if (validTasks.length === 0) {
        console.warn("No valid tasks found for account:", account);
      }
      setTasks(validTasks);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      setFetchError(
        "Failed to fetch tasks. Check console for details or ensure the contract address is correct."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setTasks(items);
  };

  const handleCreateOrUpdateTask = async () => {
    if (!title.trim() || !description.trim()) {
      alert("Title and Description cannot be empty!");
      return;
    }
    if (!window.contract) {
      alert("Contract not initialized. Please connect your wallet.");
      return;
    }
    setLoading(true);
    try {
      console.log("Attempting to create task with:", {
        title,
        description,
        status,
      });
      const tx = editingTaskId
        ? await window.contract.updateTask(
            editingTaskId,
            title,
            description,
            status
          )
        : await window.contract.createTask(title, description);
      console.log("Transaction sent, hash:", tx.hash);
      await tx.wait();
      console.log("Transaction confirmed:", tx.hash);
      setOpen(false);
      setTitle("");
      setDescription("");
      setStatus(false);
      setEditingTaskId(null);
      await fetchTasks();
      alert("Task added successfully!");
    } catch (error) {
      console.error("Failed to create/update task:", error);
      if (error.code === "CALL_EXCEPTION") {
        alert(
          "Contract call failed. Check if the contract address and ABI are correct and you have enough SepoliaETH."
        );
      } else if (error.code === "INSUFFICIENT_FUNDS") {
        alert("Insufficient SepoliaETH. Use a faucet to fund your account.");
      } else {
        alert("An error occurred. See console for details.");
      }
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
        console.log("Deleting task with ID:", taskId);
        const tx = await window.contract.deleteTask(taskId.toString());
        await tx.wait();
        await fetchTasks();
        alert("Task deleted successfully!");
      } catch (error) {
        console.error("Failed to delete task:", error);
        alert("Failed to delete task. Check console for details.");
      }
    }
  };

  return (
    <div className={`App ${darkMode ? "dark-mode" : ""}`}>
      <div className="container">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Task Manager</h1>
          <div>
            <Button variant="contained" color="primary" onClick={connectWallet}>
              {account
                ? `${account.slice(0, 6)}...${account.slice(-4)}`
                : "Connect Wallet"}
            </Button>
            <FormControlLabel
              control={
                <Switch
                  checked={darkMode}
                  onChange={() => setDarkMode(!darkMode)}
                />
              }
              label="Dark Mode"
            />
          </div>
        </div>
        <div className="mb-4">
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setOpen(true)}
            disabled={loading}
            className="mr-2"
          >
            {loading ? "Adding..." : "Add Task"}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={fetchTasks}
            disabled={loading}
          >
            Refresh Tasks
          </Button>
          {fetchError && <p className="text-red-500 mt-2">{fetchError}</p>}
        </div>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="tasks">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef}>
                {tasks.length === 0 ? (
                  <p className="text-gray-500">
                    No tasks found for this account.
                  </p>
                ) : (
                  tasks.map((task, index) => {
                    if (!task || !task.taskId || !task.title) {
                      console.warn("Skipping invalid task:", task);
                      return null;
                    }
                    return (
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
                            className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-2 flex justify-between items-center"
                          >
                            <div>
                              <h2 className="text-xl">{task.title}</h2>
                              <p>{task.description}</p>
                              <p
                                className={
                                  task.status
                                    ? "text-green-500"
                                    : "text-red-500"
                                }
                              >
                                Status: {task.status ? "Completed" : "Pending"}
                              </p>
                            </div>
                            <div>
                              <Button
                                onClick={() => handleEditTask(task)}
                                color="primary"
                              >
                                Edit
                              </Button>
                              <Button
                                onClick={() =>
                                  handleDeleteTask(task.taskId.toString())
                                }
                                color="secondary"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          TransitionComponent={Transition}
          keepMounted
        >
          <DialogTitle>{editingTaskId ? "Edit Task" : "Add Task"}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Title"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={!title.trim()}
              helperText={!title.trim() ? "Title is required" : ""}
            />
            <TextField
              margin="dense"
              label="Description"
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={!description.trim()}
              helperText={!description.trim() ? "Description is required" : ""}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={status}
                  onChange={(e) => setStatus(e.target.checked)}
                />
              }
              label="Completed"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} color="primary">
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrUpdateTask}
              color="primary"
              disabled={loading}
            >
              {loading ? "Processing..." : editingTaskId ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
