const GainEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, label, data }) => {
    const isNegative = data?.isNegative || false;
    
    let edgePath;
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;
    const xDistance = Math.abs(targetX - sourceX);
    const yDistance = Math.abs(targetY - sourceY);
    const arcFactor = Math.max(xDistance, yDistance) * 0.45;
    
    let controlX = midX;
    let controlY = midY;
    

    if (sourcePosition === "right" && targetPosition === "left") {
    edgePath = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`; // st. line
    }
    else if (sourcePosition === "top" && targetPosition === "top") {
    controlY = Math.min(sourceY, targetY) - arcFactor; // curve upwards
    edgePath =` M ${sourceX} ${sourceY} Q ${controlX} ${controlY} ${targetX} ${targetY}`;
    }
    else if (sourcePosition === "bottom" && targetPosition === "bottom") {
    controlY = Math.max(sourceY, targetY) + arcFactor; // curve downwards
    edgePath =` M ${sourceX} ${sourceY} Q ${controlX} ${controlY} ${targetX} ${targetY}`;
    }

    const displayLabel = isNegative ? `-${label}` : label;
    
    // create a unique ID for this path to reference in textPath
    const pathId = `path-${id}`;
    
    return (
    <>
        
        <path
        id={pathId}
        className="react-flow__edge-path"
        d={edgePath}
        stroke="#0066CC"
        strokeWidth={7}
        fill="none"
        markerEnd="url(#arrowhead)"
        />

        {label && (
        <text
            dy={5}
            fill="#0066CC"
            fontSize="12px"
            fontWeight="bold"
            textAnchor="middle"
            style={{
            stroke: "white",
            strokeWidth: "5px",
            strokeLinejoin: "round",
            strokeLinecap: "round",
            paintOrder: "stroke"
            }}
        >
            <textPath
            href={`#${pathId}`}
            startOffset="50%"
            >
            {displayLabel}
            </textPath>
        </text>
        )}

        <defs>
        <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
        >
            <polygon points="0 0, 10 3.5, 0 7" fill="#0066CC" />
        </marker>
        </defs>
    </>
    );
};

export default GainEdge;