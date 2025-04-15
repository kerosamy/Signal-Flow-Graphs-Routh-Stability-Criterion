import React, { useRef, useState, useEffect } from 'react';
import ResultModal from './ResultModal';
import GainMenu from './GainMenu';
import AnalyzeModal from './AnalyzeModal';
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


  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [showDeleteNodeModal, setShowDeleteNodeModal] = useState(false);
  const [showDeleteEdgeModal, setShowDeleteEdgeModal] = useState(false);

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
    const { source, target, sourceHandle, targetHandle } = params;

    if (targetHandle?.includes("left") && sourceHandle?.includes("right")) {
      const targetNumberMatch = target?.match(/^S(\d+)$/);
      const sourceNumberMatch = source?.match(/^S(\d+)$/);

      if (targetNumberMatch && sourceNumberMatch) {
        const targetNumber = parseInt(targetNumberMatch[1], 10);
        const sourceNumber = parseInt(sourceNumberMatch[1], 10);

        if (targetNumber <= sourceNumber) {
          console.log(`Invalid connection: When connecting from the right handle of S${sourceNumber} to the left handle of S${targetNumber}, target number must be less than source number.`);
          return;
        }
      }
    }

    if (
      (sourceHandle?.includes("top") && targetHandle?.includes("bottom")) || 
      (sourceHandle?.includes("bottom") && targetHandle?.includes("top")) || 
      (sourceHandle?.includes("right") && targetHandle?.includes("bottom")) ||
      (sourceHandle?.includes("bottom") && targetHandle?.includes("left")) ||
      (sourceHandle?.includes("left") && targetHandle?.includes("top")) ||
      (sourceHandle?.includes("left") && targetHandle?.includes("bottom")) 
    ) {
      console.log("Invalid connection: Top source cannot connect to Bottom source.");
      return; 
    }

    setPendingConnection(params);
    setShowGainMenu(true);
  };


  const onNodeClick = (_, node) => {
    setSelectedNode(node);
  };

  const onEdgeClick = (_, edge) => {
    setSelectedEdge(edge);
  };

  const deleteNode = () => {
    if (selectedNode) {
      const nodeId = selectedNode.id;

      setEdges(edges => edges.filter(edge => 
        edge.source !== nodeId && edge.target !== nodeId
      ));

      setNodes(nodes => {
        const remainingNodes = nodes.filter(node => node.id !== nodeId);

        remainingNodes.sort((a, b) => {
          const aNum = parseInt(a.id.replace('S', ''), 10);
          const bNum = parseInt(b.id.replace('S', ''), 10);
          return aNum - bNum;
        });

        return remainingNodes.map((node, index) => {
          const newId = `S${index + 1}`;
          

          setEdges(edges => edges.map(edge => {
            if (edge.source === node.id) {
              return { ...edge, source: newId };
            }
            if (edge.target === node.id) {
              return { ...edge, target: newId };
            }
            return edge;
          }));

          return {
            ...node,
            id: newId,
            data: { ...node.data, label: newId }
          };
        });
      });
      
      setNextId(nodes.length);
      
      setSelectedNode(null);
      setShowDeleteNodeModal(false);
    }
  };


  const deleteEdge = () => {
    if (selectedEdge) {
      const edgeId = selectedEdge.id;
      setEdges(edges => edges.filter(edge => edge.id !== edgeId));
      

      setSelectedEdge(null);
      setShowDeleteEdgeModal(false);
    }
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

  useEffect(() => {console.log(edges);console.log(nodes)}, [nodes, edges]);

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
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              snapToGrid
              snapGrid={[15, 15]}
            >
              <div style={{ fontSize: '500px' }}>

              </div>
              <MiniMap />
              <Background variant="dots" gap={12} size={1} />
              <Panel position="top-left"
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px' 
                }}
              >
                <div className="draggable-signal-button" draggable onDragStart={onDragStart}>
                  + Add Signal
                </div>
                <button className="analyze-btn" onClick={handleAnalyze}>
                  Analyze Graph
                </button>

                <button 
                  className="delete-node-btn"
                  onClick={() => {
                    if (selectedNode) {
                      setShowDeleteNodeModal(true);
                    } else {
                      alert('Please select a node to delete');
                    }
                  }}
                >
                  Delete Node
                </button>
                
                <button 
                  className="delete-edge-btn"
                  onClick={() => {
                    if (selectedEdge) {
                      setShowDeleteEdgeModal(true);
                    } else {
                      alert('Please select an edge to delete');
                    }
                  }}
                >
                  Delete Edge
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
            

            {showDeleteNodeModal && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3>Delete Node</h3>
                  <p>Are you sure you want to delete node {selectedNode?.id}?</p>
                  <p>This will also delete all connected edges.</p>
                  <div className="modal-buttons">
                    <button onClick={deleteNode}>Delete</button>
                    <button onClick={() => setShowDeleteNodeModal(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
            

            {showDeleteEdgeModal && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3>Delete Edge</h3>
                  <p>Are you sure you want to delete this edge?</p>
                  <p>From: {selectedEdge?.source} to {selectedEdge?.target}</p>
                  <div className="modal-buttons">
                    <button onClick={deleteEdge}>Delete</button>
                    <button onClick={() => setShowDeleteEdgeModal(false)}>Cancel</button>
                  </div>
                </div>
              </div>
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