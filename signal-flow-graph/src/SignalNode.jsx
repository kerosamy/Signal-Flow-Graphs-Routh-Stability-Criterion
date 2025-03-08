import { Handle, Position } from '@xyflow/react';

const SignalNode = ({ data }) => (
<div
    className="signal-node"
    style={{
    background: "#f2f2f2",
    border: "2px solid #555",
    borderRadius: "50%",
    width: "80px",
    height: "80px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    fontSize: "14px",
    position: "relative"
    }}
>
    <Handle
    id="left"
    type="target"
    position={Position.Left}
    style={{ background: "#555", width: "10px", height: "10px"}}
    />
    <Handle
    id="top"
    type="source"
    position={Position.Top}
    style={{ background: "#555", width: "10px", height: "10px" }}
    />
    <Handle
    id="top"
    type="target"
    position={Position.Top}
    style={{ background: "#555", width: "10px", height: "10px" }}
    />
    <Handle
    id="right"
    type="source"
    position={Position.Right}
    style={{ background: "#555", width: "10px", height: "10px" }}
    />
    <Handle
    id="bottom"
    type="source"
    position={Position.Bottom}
    style={{ background: "#555", width: "10px", height: "10px" }}
    />
    <Handle
    id="bottom"
    type="target"
    position={Position.Bottom}
    style={{ background: "#555", width: "10px", height: "10px" }}
    />

    
    <div>{data.label}</div>
    {data.value && <div>{data.value}</div>}
</div>
);

export default SignalNode;