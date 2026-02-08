import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

function App() {
  const [tasks, setTasks] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch('http://localhost:3001/api/tasks/my-tasks', {
      headers: { 'x-user-id': 'user_alice' }
    })
      .then(res => res.json())
      .then(data => {
        setTasks(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load tasks:', err)
        setLoading(false)
      })
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Dispatch Minimal ⚡</h1>
      <p>Minimal Electron + React + Backend</p>

      <h2>My Tasks</h2>
      {loading ? (
        <p>Loading...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks found</p>
      ) : (
        <ul>
          {tasks.map((task: any) => (
            <li key={task.id}>
              <strong>{task.title}</strong>
              <br />
              <small>{task.description}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
