import React, { useState, useRef } from 'react';
import { Box, TextField, Dialog, DialogActions, DialogContent, DialogTitle, Button } from '@mui/material';
import { useFishboneData } from '../hooks/useFishboneData';
import DiagramNode from './DiagramNode';
import HoverToolbar from './HoverToolbar';

function FishboneCanvas() {
  const { state, dispatch } = useFishboneData();
  const svgRef = useRef(null);
  const [editDialog, setEditDialog] = useState({ open: false, type: '', data: null });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [dragState, setDragState] = useState({ isDragging: false, nodeData: null, offset: { x: 0, y: 0 } });

  const canvasWidth = 1200;
  const canvasHeight = 800;
  const spineY = canvasHeight / 2;

  // Handle problem statement click
  const handleProblemStatementClick = () => {
    setEditDialog({
      open: true,
      type: 'problemStatement',
      data: { text: state.problemStatement },
    });
  };

  // Handle edit dialog
  const handleEditSave = () => {
    if (editDialog.type === 'problemStatement') {
      dispatch({ type: 'SET_PROBLEM_STATEMENT', payload: editDialog.data.text });
    } else if (editDialog.type === 'category') {
      dispatch({
        type: 'UPDATE_CATEGORY',
        payload: { id: editDialog.data.id, updates: { name: editDialog.data.text } },
      });
    } else if (editDialog.type === 'cause') {
      dispatch({
        type: 'UPDATE_CAUSE',
        payload: {
          categoryId: editDialog.data.categoryId,
          causeId: editDialog.data.id,
          updates: { name: editDialog.data.text },
        },
      });
    } else if (editDialog.type === 'subcause') {
      dispatch({
        type: 'UPDATE_SUBCAUSE',
        payload: {
          categoryId: editDialog.data.categoryId,
          causeId: editDialog.data.causeId,
          subcauseId: editDialog.data.id,
          updates: { name: editDialog.data.text },
        },
      });
    }
    setEditDialog({ open: false, type: '', data: null });
  };

  // Handle mouse events for dragging
  const handleMouseDown = (event, node, type, categoryId = null, causeId = null) => {
    event.preventDefault();
    const rect = svgRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setDragState({
      isDragging: true,
      nodeData: { ...node, type, categoryId, causeId },
      offset: { x: x - node.x, y: y - node.y },
    });
  };

  const handleMouseMove = (event) => {
    if (!dragState.isDragging) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left - dragState.offset.x;
    const y = event.clientY - rect.top - dragState.offset.y;
    
    const { nodeData } = dragState;
    
    if (nodeData.type === 'category') {
      dispatch({
        type: 'UPDATE_CATEGORY',
        payload: { id: nodeData.id, updates: { x, y } },
      });
    } else if (nodeData.type === 'cause') {
      dispatch({
        type: 'UPDATE_CAUSE',
        payload: {
          categoryId: nodeData.categoryId,
          causeId: nodeData.id,
          updates: { x, y },
        },
      });
    } else if (nodeData.type === 'subcause') {
      dispatch({
        type: 'UPDATE_SUBCAUSE',
        payload: {
          categoryId: nodeData.categoryId,
          causeId: nodeData.causeId,
          subcauseId: nodeData.id,
          updates: { x, y },
        },
      });
    }
  };

  const handleMouseUp = () => {
    setDragState({ isDragging: false, nodeData: null, offset: { x: 0, y: 0 } });
  };

  // Render connection lines
  const renderConnections = () => {
    const lines = [];
    
    state.categories.forEach(category => {
      // Draw line from category to spine
      lines.push(
        <line
          key={`spine-${category.id}`}
          x1={category.x}
          y1={category.y}
          x2={canvasWidth - 200}
          y2={spineY}
          stroke="#6750A4"
          strokeWidth="2"
        />
      );
      
      // Draw lines from causes to category
      category.causes.forEach(cause => {
        lines.push(
          <line
            key={`cause-${cause.id}`}
            x1={cause.x}
            y1={cause.y}
            x2={category.x}
            y2={category.y}
            stroke="#625B71"
            strokeWidth="1.5"
          />
        );
        
        // Draw lines from subcauses to cause
        cause.subcauses.forEach(subcause => {
          lines.push(
            <line
              key={`subcause-${subcause.id}`}
              x1={subcause.x}
              y1={subcause.y}
              x2={cause.x}
              y2={cause.y}
              stroke="#7D7489"
              strokeWidth="1"
            />
          );
        });
      });
    });
    
    return lines;
  };

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100vh', overflow: 'auto' }}>
      <svg
        ref={svgRef}
        width={canvasWidth}
        height={canvasHeight}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ cursor: dragState.isDragging ? 'grabbing' : 'default' }}
      >
        {/* Main spine line */}
        <line
          x1={50}
          y1={spineY}
          x2={canvasWidth - 200}
          y2={spineY}
          stroke="#6750A4"
          strokeWidth="4"
        />
        
        {/* Problem statement */}
        <g>
          <rect
            x={canvasWidth - 180}
            y={spineY - 30}
            width={160}
            height={60}
            fill="#6750A4"
            rx="8"
            onClick={handleProblemStatementClick}
            style={{ cursor: 'pointer' }}
          />
          <text
            x={canvasWidth - 100}
            y={spineY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="12"
            fontWeight="500"
            style={{ pointerEvents: 'none' }}
          >
            {state.problemStatement.length > 20
              ? state.problemStatement.substring(0, 17) + '...'
              : state.problemStatement}
          </text>
        </g>
        
        {/* Connection lines */}
        {renderConnections()}
        
        {/* Categories */}
        {state.categories.map(category => (
          <DiagramNode
            key={category.id}
            node={category}
            type="category"
            onMouseDown={(e) => handleMouseDown(e, category, 'category')}
            onMouseEnter={() => setHoveredNode({ ...category, type: 'category' })}
            onMouseLeave={() => setHoveredNode(null)}
            onEdit={(text) => setEditDialog({ open: true, type: 'category', data: { ...category, text } })}
            onDelete={() => dispatch({ type: 'DELETE_CATEGORY', payload: category.id })}
            onAddSubnode={() => dispatch({ type: 'ADD_CAUSE', payload: { categoryId: category.id } })}
          />
        ))}
        
        {/* Causes */}
        {state.categories.map(category =>
          category.causes.map(cause => (
            <DiagramNode
              key={cause.id}
              node={cause}
              type="cause"
              onMouseDown={(e) => handleMouseDown(e, cause, 'cause', category.id)}
              onMouseEnter={() => setHoveredNode({ ...cause, type: 'cause', categoryId: category.id })}
              onMouseLeave={() => setHoveredNode(null)}
              onEdit={(text) => setEditDialog({ 
                open: true, 
                type: 'cause', 
                data: { ...cause, categoryId: category.id, text } 
              })}
              onDelete={() => dispatch({ 
                type: 'DELETE_CAUSE', 
                payload: { categoryId: category.id, causeId: cause.id } 
              })}
              onAddSubnode={() => dispatch({ 
                type: 'ADD_SUBCAUSE', 
                payload: { categoryId: category.id, causeId: cause.id } 
              })}
            />
          ))
        )}
        
        {/* Subcauses */}
        {state.categories.map(category =>
          category.causes.map(cause =>
            cause.subcauses.map(subcause => (
              <DiagramNode
                key={subcause.id}
                node={subcause}
                type="subcause"
                onMouseDown={(e) => handleMouseDown(e, subcause, 'subcause', category.id, cause.id)}
                onMouseEnter={() => setHoveredNode({ 
                  ...subcause, 
                  type: 'subcause', 
                  categoryId: category.id, 
                  causeId: cause.id 
                })}
                onMouseLeave={() => setHoveredNode(null)}
                onEdit={(text) => setEditDialog({ 
                  open: true, 
                  type: 'subcause', 
                  data: { ...subcause, categoryId: category.id, causeId: cause.id, text } 
                })}
                onDelete={() => dispatch({ 
                  type: 'DELETE_SUBCAUSE', 
                  payload: { categoryId: category.id, causeId: cause.id, subcauseId: subcause.id } 
                })}
              />
            ))
          )
        )}
      </svg>
      
      {/* Hover toolbar */}
      {hoveredNode && (
        <HoverToolbar
          node={hoveredNode}
          onEdit={() => {
            const text = hoveredNode.name;
            if (hoveredNode.type === 'category') {
              setEditDialog({ open: true, type: 'category', data: { ...hoveredNode, text } });
            } else if (hoveredNode.type === 'cause') {
              setEditDialog({ open: true, type: 'cause', data: { ...hoveredNode, text } });
            } else if (hoveredNode.type === 'subcause') {
              setEditDialog({ open: true, type: 'subcause', data: { ...hoveredNode, text } });
            }
          }}
          onDelete={() => {
            if (hoveredNode.type === 'category') {
              dispatch({ type: 'DELETE_CATEGORY', payload: hoveredNode.id });
            } else if (hoveredNode.type === 'cause') {
              dispatch({ 
                type: 'DELETE_CAUSE', 
                payload: { categoryId: hoveredNode.categoryId, causeId: hoveredNode.id } 
              });
            } else if (hoveredNode.type === 'subcause') {
              dispatch({ 
                type: 'DELETE_SUBCAUSE', 
                payload: { 
                  categoryId: hoveredNode.categoryId, 
                  causeId: hoveredNode.causeId, 
                  subcauseId: hoveredNode.id 
                } 
              });
            }
          }}
          onAddSubnode={() => {
            if (hoveredNode.type === 'category') {
              dispatch({ type: 'ADD_CAUSE', payload: { categoryId: hoveredNode.id } });
            } else if (hoveredNode.type === 'cause') {
              dispatch({ 
                type: 'ADD_SUBCAUSE', 
                payload: { categoryId: hoveredNode.categoryId, causeId: hoveredNode.id } 
              });
            }
          }}
        />
      )}
      
      {/* Edit dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, type: '', data: null })}>
        <DialogTitle>
          Edit {editDialog.type === 'problemStatement' ? 'Problem Statement' : editDialog.type}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline={editDialog.type === 'problemStatement'}
            rows={editDialog.type === 'problemStatement' ? 3 : 1}
            value={editDialog.data?.text || ''}
            onChange={(e) => setEditDialog(prev => ({ 
              ...prev, 
              data: { ...prev.data, text: e.target.value } 
            }))}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && editDialog.type !== 'problemStatement') {
                handleEditSave();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, type: '', data: null })}>
            Cancel
          </Button>
          <Button onClick={handleEditSave} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FishboneCanvas; 