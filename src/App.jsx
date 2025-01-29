import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import abi from "../abi.json";
import "./App.css";  // You'll need to create this CSS file

const PRIMARY_CONTRACT_ADDRESS = "0xDb487631767361A0abe6Cc235824d08279B09F16";

const App = () => {
  // Blockchain states
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [balance, setBalance] = useState("0");
  
  // UI states
  const [tasks, setTasks] = useState([]);
  const [amount, setAmount] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskText, setNewTaskText] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    initializeEthers();
  }, []);

  useEffect(() => {
    if (contract) {
      loadTasks();
      getBalance();
    }
  }, [contract]);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ ...notification, show: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
  };

  const initializeEthers = async () => {
    if (!window.ethereum) {
      showNotification('Please install MetaMask to use this application.', 'error');
      return;
    }

    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const _provider = new ethers.BrowserProvider(window.ethereum);
      const _signer = await _provider.getSigner();
      const _contract = new ethers.Contract(PRIMARY_CONTRACT_ADDRESS, abi, _signer);

      setProvider(_provider);
      setSigner(_signer);
      setContract(_contract);
      showNotification('MetaMask connected successfully!');

      window.ethereum.on('accountsChanged', () => window.location.reload());
      window.ethereum.on('chainChanged', () => window.location.reload());
    } catch (error) {
      showNotification('Failed to connect to MetaMask.', 'error');
      console.error(error);
    }
  };

  const loadTasks = async () => {
    if (!contract) return;
    try {
      setLoading(true);
      const result = await contract.getMyTask();
      setTasks(result);
    } catch (err) {
      showNotification('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getBalance = async () => {
    if (!provider || !contract) return;
    try {
      const _balance = await provider.getBalance(PRIMARY_CONTRACT_ADDRESS);
      setBalance(ethers.formatEther(_balance));
    } catch (error) {
      showNotification('Failed to fetch balance.', 'error');
      console.error("Balance fetch error:", error);
    }
  };

  const handleTransaction = async (operation, handler) => {
    if (!contract) {
      showNotification('Please connect your wallet first.', 'error');
      return;
    }
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      showNotification('Please enter a valid amount.', 'error');
      return;
    }

    try {
      setLoading(true);
      const tx = await handler();
      await tx.wait();
      showNotification(`${operation} successful!`);
      getBalance();
      setAmount("");
    } catch (error) {
      console.error(error);
      const errorMessage = error.code === "CALL_EXCEPTION" 
        ? `Insufficient balance for ${operation.toLowerCase()}.`
        : `${operation} failed!`;
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const deposit = () => handleTransaction('Deposit', 
    () => contract.deposit({ value: ethers.parseEther(amount) }));

  const withdraw = () => handleTransaction('Withdrawal',
    () => contract.withdraw(ethers.parseEther(amount)));

  const addTask = async (e) => {
    e.preventDefault();
    if (!contract) {
      showNotification('Please connect your wallet first.', 'error');
      return;
    }
    
    if (!newTaskTitle.trim() || !newTaskText.trim()) {
      showNotification('Please enter both task title and description.', 'error');
      return;
    }

    try {
      setLoading(true);
      const tx = await contract.addTask(newTaskText.trim(), newTaskTitle.trim(), false);
      await tx.wait();
      showNotification('Task added successfully!');
      setNewTaskTitle('');
      setNewTaskText('');
      loadTasks();
    } catch (err) {
      showNotification('Failed to add task', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId) => {
    if (!contract) return;
    try {
      setLoading(true);
      const tx = await contract.deleteTask(taskId);
      await tx.wait();
      showNotification('Task deleted successfully!');
      loadTasks();
    } catch (err) {
      showNotification('Failed to delete task', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Task DApp</h1>

      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="card">
        <h2>Wallet Balance</h2>
        <p className="balance">{balance} ETH</p>
        <div className="form-group">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (ETH)"
            min="0"
            step="0.01"
          />
          <button onClick={deposit} disabled={loading} className="btn primary">
            Deposit
          </button>
          <button onClick={withdraw} disabled={loading} className="btn secondary">
            Withdraw
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Add New Task</h2>
        <form onSubmit={addTask}>
          <div className="form-group">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task Title"
              required
            />
          </div>
          <div className="form-group">
            <textarea
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Task Description"
              required
              rows={3}
            />
          </div>
          <button type="submit" disabled={loading} className="btn primary">
            Add Task
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Your Tasks</h2>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : tasks.length === 0 ? (
          <p className="no-tasks">No tasks found.</p>
        ) : (
          <div className="tasks-list">
            {tasks.map((task, index) => (
              <div key={index} className="task-card">
                <h3>{task.taskTitle}</h3>
                <p>{task.taskText}</p>
                <button 
                  onClick={() => deleteTask(task.id)}
                  disabled={loading}
                  className="btn danger"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;