import { useState } from "react";
import { ethers } from "ethers";
import abi from "../abi.json";

const contractAddress = "0xDb487631767361A0abe6Cc235824d08279B09F16";

function App() {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskText, setTaskText] = useState("");
  const [tasks, setTasks] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [isActiveWallet, setIsActiveWallet] = useState(false);

  const connectWallet = async () => {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      setWallet(await signer.getAddress());
      setIsActiveWallet(true);
    } else {
      alert("Please install MetaMask to use this application.");
    }
  };

  const addTask = async () => {
    if (!wallet) return alert("Connect your wallet first.");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);
    const tx = await contract.addTask(taskText, taskTitle, false);
    await tx.wait();
    fetchTasks();
  };

  const fetchTasks = async () => {
    if (!wallet) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, abi, provider);
    const tasks = await contract.getMyTask();
    setTasks(tasks);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-6">Task Manager DApp</h1>
      <button
        onClick={connectWallet}
        className="bg-blue-600 px-4 py-2 rounded-lg mb-4"
      >
        {wallet ? "Wallet Connected" : "Connect Wallet"}
      </button>
      {wallet && <p className="mb-4">Connected: {wallet}</p>}
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <input
          type="text"
          placeholder="Task Title"
          className="w-full p-2 rounded mb-2 bg-gray-700"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
        />
        <textarea
          placeholder="Task Description"
          className="w-full p-2 rounded mb-2 bg-gray-700"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
        ></textarea>
        <button
          onClick={addTask}
          className="bg-green-600 px-4 py-2 rounded-lg w-full"
        >
          Add Task
        </button>
      </div>
      <div className="mt-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Your Tasks</h2>
        {tasks.length > 0 ? (
          tasks.map((task, index) => (
            <div key={index} className="bg-gray-800 p-4 rounded-lg mb-2">
              <h3 className="font-bold">{task.taskTitle}</h3>
              <p>{task.taskText}</p>
            </div>
          ))
        ) : (
          <p>No tasks available.</p>
        )}
      </div>
    </div>
  );
}

export default App;