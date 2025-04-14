import { useState } from 'react'
import RouthCriterion from './Pages/Routh/Routh'
import SignalFlowGraph from './Pages/SignalFlowGraph/SignalFlowGraph'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <SignalFlowGraph></SignalFlowGraph>
    </>
  )
}

export default App