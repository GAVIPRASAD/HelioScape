import { useState, useEffect } from 'react'

function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000')
      .then(res => res.json())
      .then(data => setData(data.message))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
      <h1 className="text-4xl font-bold text-primary">HelioScape</h1>
      <p className="text-xl">Status: {data ? '✅ Server Connected' : '⏳ Connecting...'}</p>
      <div className="p-4 bg-surface rounded-lg shadow border border-gray-200 dark:border-gray-800">
        <p className="font-mono">Distributed Storage System Initialized</p>
      </div>
    </div>
  )
}

export default App
