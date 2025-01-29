import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import abi from "../abi.json";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

const CONTRACT_ADDRESS = "0xDb487631767361A0abe6Cc235824d08279B09F16";

const App = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskText, setNewTaskText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeEthers();
  }, []);

  useEffect(() => {
    if (contract && account) {
      loadTasks();
    }
  }, [contract, account]);

  const initializeEthers = async () => {
    if (!window.ethereum) {
      toast.error("Please install MetaMask.");
      return;
    }

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const _provider = new ethers.BrowserProvider(window.ethereum);
      const _signer = await _provider.getSigner();
      const _contract = new ethers.Contract(CONTRACT_ADDRESS, abi, _signer);
      const accounts = await window.ethereum.request({ method: "eth_accounts" });

      setProvider(_provider);
      setSigner(_signer);
      setContract(_contract);
      setAccount(accounts[0]);
      toast.success("MetaMask connected successfully!");
    } catch (error) {
      toast.error("Failed to connect to MetaMask.");
      console.error(error);
    }
  };

  const loadTasks = async () => {
    if (!contract) return;
    try {
      const tasksArray = await contract.getMyTasks();
      const formattedTasks = tasksArray.map(task => ({
        id: task.id.toString(),
        title: task.taskTitle,
        text: task.taskText,
      }));
      setTasks(formattedTasks);
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast.error("Failed to load tasks.");
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!contract || !account) {
      toast.error("Please connect your wallet first.");
      return;
    }

    if (!newTaskTitle.trim() || !newTaskText.trim()) {
      toast.error("Please enter both task title and description.");
      return;
    }

    try {
      setLoading(true);
      toast.info("Submitting transaction...");

      const tx = await contract.addTask(newTaskTitle.trim(), newTaskText.trim());
      await tx.wait();

      setNewTaskTitle("");
      setNewTaskText("");
      toast.success("Task added successfully!");
      await loadTasks();
    } catch (error) {
      console.error("Transaction Failed:", error);
      toast.error("Transaction failed. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId) => {
    if (!contract || !account) {
      toast.error("Please connect your wallet first.");
      return;
    }

    try {
      setLoading(true);
      toast.info("Deleting task...");

      const tx = await contract.deleteTask(taskId);
      await tx.wait();

      toast.success("Task deleted successfully!");
      await loadTasks();
    } catch (error) {
      console.error("Transaction Failed:", error);
      toast.error("Failed to delete task.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Task DApp</h1>
      <button onClick={initializeEthers}>Connect MetaMask</button>
      <form onSubmit={addTask}>
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Task Title"
          required
          disabled={loading}
        />
        <textarea
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Task Description"
          required
          disabled={loading}
        />
        <button type="submit" disabled={loading}>{loading ? "Processing..." : "Add Task"}</button>
      </form>
      <div>
        {tasks.length === 0 ? (
          <p>No tasks found.</p>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="task">
              <h3>{task.title}</h3>
              <p>{task.text}</p>
              <button onClick={() => deleteTask(task.id)} disabled={loading}>Delete</button>
            </div>
          ))
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default App;
