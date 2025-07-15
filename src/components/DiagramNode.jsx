import React from 'react';

function DiagramNode({ 
  node, 
  type, 
  onMouseDown, 
  onMouseEnter, 
  onMouseLeave, 
  onEdit, 
  onDelete, 
  onAddSubnode 
}) {
  // Different colors and sizes for different node types - Orange, Gray, Light Blue
  const getNodeStyle = () => {
    switch (type) {
      case 'category':
        return {
          fill: '#FF8C00', // Orange
          stroke: '#E67300',
          strokeWidth: 2,
          width: 100,
          height: 40,
          fontSize: 12,
          fontWeight: '600',
        };
      case 'cause':
        return {
          fill: '#6B7280', // Gray
          stroke: '#4B5563',
          strokeWidth: 1.5,
          width: 80,
          height: 32,
          fontSize: 11,
          fontWeight: '500',
        };
      case 'subcause':
        return {
          fill: '#87CEEB', // Light Blue
          stroke: '#5BA7D9',
          strokeWidth: 1,
          width: 70,
          height: 28,
          fontSize: 10,
          fontWeight: '400',
        };
      default:
        return {
          fill: '#FF8C00', // Orange
          stroke: '#E67300',
          strokeWidth: 2,
          width: 80,
          height: 32,
          fontSize: 11,
          fontWeight: '500',
        };
    }
  };

  const style = getNodeStyle();
  const x = node.x - style.width / 2;
  const y = node.y - style.height / 2;

  // Truncate text if too long
  const displayText = node.name.length > 12 
    ? node.name.substring(0, 9) + '...' 
    : node.name;

  return (
    <g>
      {/* Node background */}
      <rect
        x={x}
        y={y}
        width={style.width}
        height={style.height}
        fill={style.fill}
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        rx="6"
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ cursor: 'grab' }}
      />
      
      {/* Node text */}
      <text
        x={node.x}
        y={node.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={style.fontSize}
        fontWeight={style.fontWeight}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {displayText}
      </text>
      
      {/* Show comment indicator if comment exists */}
      {node.comment && (
        <circle
          cx={x + style.width - 8}
          cy={y + 8}
          r="4"
          fill="#FFB300"
          stroke="white"
          strokeWidth="1"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </g>
  );
}

export default DiagramNode; 