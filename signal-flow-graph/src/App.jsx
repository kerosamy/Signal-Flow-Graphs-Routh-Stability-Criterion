import { useState } from 'react'
import RouthCriterion from './Pages/Routh'; // adjust the path based on the file location


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <RouthCriterion />
    </>
  )
}

export default App
