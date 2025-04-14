import React, { useRef, useState, useEffect } from 'react';
import ResultModal from './ResultModal';
import GainMenu from './GainMenu'; // Import GainMenu component
import AnalyzeModal from './AnalyzeModal'; // Import AnalyzeModal component
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
import GainEdge from '../../Components/GainEdge';
import SignalNode from '../../Components/SignalNode';
import './signalflowgraph.css'; 

function SignalFlowGraph() {
  
  const nodeTypes = { 
    signal: SignalNode 
  };
  const edgeTypes = { 
    gainEdge: GainEdge 
  };

  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  const [analysisResult, setAnalysisResult] = useState(null); 
  const [showResultModal, setShowResultModal] = useState(false); 

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [nextId, setNextId] = useState(1);
  const [showGainMenu, setShowGainMenu] = useState(false);
  const [pendingConnection, setPendingConnection] = useState(null);
  const [gainValue, setGainValue] = useState('K');
  const [isNegative, setIsNegative] = useState(false);

  // State for the analyze modal
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [sourceNode, setSourceNode] = useState('');
  const [destNode, setDestNode] = useState('');

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
      id: `S${nextId}`,
      type: 'signal',
      position,
      data: { label:`S${nextId}` },
    };

    setNodes((nds) => [...nds, newNode]);
    setNextId(nextId + 1);
  };

  const onDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const onConnect = (params) => {
    const { sourceHandle, targetHandle } = params;

    if (
      (sourceHandle?.includes("top") && targetHandle?.includes("bottom")) || 
      (sourceHandle?.includes("bottom") && targetHandle?.includes("top")) || 
      (sourceHandle?.includes("right") && targetHandle?.includes("bottom")) ||
      (sourceHandle?.includes("right") && targetHandle?.includes("top"))
    ) {
      console.log("Invalid connection: Top source cannot connect to Bottom source.");
      return; 
    }

    setPendingConnection(params);
    setShowGainMenu(true);
  };

  const applyGain = () => {
    if (pendingConnection) {
      const { source, target, sourceHandle, targetHandle } = pendingConnection;
      const newEdge = {
        ...pendingConnection,
        id:` e-${source}-${target}-${sourceHandle}-${targetHandle}`,
        label: isNegative ? `-${gainValue}` : gainValue,
        type: 'gainEdge',
        data: { isNegative },
      };

      setEdges((eds) => addEdge(newEdge, eds));
      setShowGainMenu(false);
      setPendingConnection(null);
      setGainValue('K');
      setIsNegative(false);
      console.log(edges);
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

  const handleAnalyze = () => {
    setShowAnalyzeModal(true); 
    console.log(showAnalyzeModal)
  };

  const submitAnalysis = async () => {
    const graphData = {
      nodes: nodes,
      edges: edges,
      sourceNode: sourceNode,
      destNode: destNode,
    };
    setShowAnalyzeModal(false); 
    const response = await fetch('http://127.0.0.1:5000/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(graphData),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Analysis result:', data);
      setAnalysisResult(data); // Store the analysis result
      setShowResultModal(true); // Open the result modal
    } else {
      console.error('Error:', response.status);
    }
  
  };

  const cancelAnalysis = () => {
    setShowAnalyzeModal(false); // Close the modal without submitting
  };
  const closeResultModal = () => {
    setShowResultModal(false); // Close the result modal
  };

  return (
    <div className="signalflowgraph">
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
              <div style={{ fontSize: '500px' }}>
                <Controls />
              </div>
              <MiniMap />
              <Background variant="dots" gap={12} size={1} />
              <Panel position="top-left">
                <div className="draggable-signal-button" draggable onDragStart={onDragStart}>
                  + Add Signal
                </div>
                <button className="analyze-btn" onClick={handleAnalyze}>
                  Analyze Graph
                </button>
              </Panel>
            </ReactFlow>

            {showGainMenu && (
              <GainMenu
                gainValue={gainValue}
                setGainValue={setGainValue}
                isNegative={isNegative}
                setIsNegative={setIsNegative}
                applyGain={applyGain}
                cancelConnection={cancelConnection}
              />
            )}
            {/* Modal for Analyze */}
            <AnalyzeModal
              showAnalyzeModal={showAnalyzeModal}
              nodes={nodes}
              sourceNode={sourceNode}
              setSourceNode={setSourceNode}
              destNode={destNode}
              setDestNode={setDestNode}
              submitAnalysis={submitAnalysis}
              cancelAnalysis={cancelAnalysis}
            />
             <ResultModal
              showResultModal={showResultModal}
              analysisResult={analysisResult}
              closeResultModal={closeResultModal}
            />

          </div>
        </div>
      </main>
    </div>
  );
}

export default SignalFlowGraph;
