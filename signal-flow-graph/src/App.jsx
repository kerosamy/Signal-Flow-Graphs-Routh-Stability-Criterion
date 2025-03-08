import React, { useRef, useState } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './App.css';
import  GainEdge  from './GainEdge';
import  SignalNode  from './SignalNode';


export default function App() {

  const nodeTypes = { 
    signal: SignalNode 
  };
  const edgeTypes = { 
    gainEdge: GainEdge 
  };

  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [nextId, setNextId] = useState(1);
  const [showGainMenu, setShowGainMenu] = useState(false);
  const [pendingConnection, setPendingConnection] = useState(null);
  const [gainValue, setGainValue] = useState('K');
  const [isNegative, setIsNegative] = useState(false);

  const onInit = (instance) => setReactFlowInstance(instance);

  const onDrop = (event) => {
    event.preventDefault();
    if (!reactFlowInstance) return;

    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });

    const newNode = {
      id: `node_${nextId}`,
      type: 'signal',
      position,
      data: { label: `S${nextId}` },
    };

    setNodes((nds) => [...nds, newNode]);
    setNextId(nextId + 1);

  };

  const onDragOver = (event) => {

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

  };

  const onConnect = (params) => {
      
    setPendingConnection(params);
    setShowGainMenu(true);
    
  };

  const applyGain = () => {
    if (pendingConnection) {
      // Detect connection type for proper edge styling
      const { source, target, sourceHandle, targetHandle } = pendingConnection;
      
      const newEdge = {
        ...pendingConnection,
        id: `e-${source}-${target}-${sourceHandle}-${targetHandle}`,
        label: gainValue,
        type: 'gainEdge',
        data: {
          isNegative: isNegative
        }
      };

      setEdges((eds) => addEdge(newEdge, eds));
      setShowGainMenu(false);
      setPendingConnection(null);
      setGainValue('K');
      setIsNegative(false);
    }
  };

  const cancelConnection = () => {
    setShowGainMenu(false);
    setPendingConnection(null);
    setIsNegative(false);
  };


  const onDragStart = (event) => {
    event.dataTransfer.setData('application/reactflow', 'signal');
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="app">
      <header>
        <h1>Signal Flow Graph Analyzer</h1>
      </header>
      <main>
        <div className="graph-container">
          <div className="flow-area" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={onInit}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              snapToGrid
              snapGrid={[15, 15]}
            >
              <Controls />
              <MiniMap />
              <Background variant="dots" gap={12} size={1} />

              <Panel position="top-left">
                <div className="draggable-signal-button" draggable onDragStart={onDragStart}>
                  + Add Signal
                </div>
                <button className="analyze-btn">
                  Analyze Graph
                </button>
              </Panel>
            </ReactFlow>

            {showGainMenu && (
              <div className="gain-menu">
                <h4>Set Gain Value</h4>
                <input
                  type="text"
                  value={gainValue}
                  onChange={(e) => setGainValue(e.target.value)}
                  placeholder="Gain value (K, 10, etc.)"
                  autoFocus
                />
                <div className="gain-menu-options">
                  <label>
                    <input
                      type="checkbox"
                      checked={isNegative}
                      onChange={(e) => setIsNegative(e.target.checked)}
                    />
                    Negative feedback (-H)
                  </label>
                </div>
                <div className="gain-menu-buttons">
                  <button className="apply-btn" onClick={applyGain}>
                    Apply
                  </button>
                  <button className="cancel-btn" onClick={cancelConnection}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}