import React, { useState } from 'react';
import { 
  Box, 
  IconButton, 
  Paper, 
  Tooltip, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button 
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  DragIndicator as DragIcon,
  Comment as CommentIcon,
} from '@mui/icons-material';
import { useFishboneData } from '../hooks/useFishboneData';

function HoverToolbar({ node, onEdit, onDelete, onAddSubnode }) {
  const { dispatch } = useFishboneData();
  const [commentDialog, setCommentDialog] = useState({ open: false, comment: node.comment || '' });

  // Position the toolbar near the node
  const toolbarX = node.x + 60;
  const toolbarY = node.y - 20;

  const handleCommentSave = () => {
    const comment = commentDialog.comment;
    
    if (node.type === 'category') {
      dispatch({
        type: 'UPDATE_CATEGORY',
        payload: { id: node.id, updates: { comment } },
      });
    } else if (node.type === 'cause') {
      dispatch({
        type: 'UPDATE_CAUSE',
        payload: {
          categoryId: node.categoryId,
          causeId: node.id,
          updates: { comment },
        },
      });
    } else if (node.type === 'subcause') {
      dispatch({
        type: 'UPDATE_SUBCAUSE',
        payload: {
          categoryId: node.categoryId,
          causeId: node.causeId,
          subcauseId: node.id,
          updates: { comment },
        },
      });
    }
    
    setCommentDialog({ open: false, comment: '' });
  };

  const canAddSubnode = node.type === 'category' || node.type === 'cause';

  return (
    <>
      <Box
        sx={{
          position: 'absolute',
          left: toolbarX,
          top: toolbarY,
          zIndex: 1000,
          pointerEvents: 'auto',
        }}
      >
        <Paper
          elevation={8}
          sx={{
            display: 'flex',
            flexDirection: 'row',
            backgroundColor: 'background.paper',
            borderRadius: 2,
            p: 0.5,
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Tooltip title="Edit name" placement="top">
            <IconButton
              size="small"
              onClick={onEdit}
              sx={{ 
                color: 'primary.main',
                '&:hover': { backgroundColor: 'primary.light', color: 'white' },
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Add/Edit comment" placement="top">
            <IconButton
              size="small"
              onClick={() => setCommentDialog({ open: true, comment: node.comment || '' })}
              sx={{ 
                color: node.comment ? 'warning.main' : 'text.secondary',
                '&:hover': { backgroundColor: 'warning.light', color: 'white' },
              }}
            >
              <CommentIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {canAddSubnode && (
            <Tooltip title={`Add ${node.type === 'category' ? 'cause' : 'subcause'}`} placement="top">
              <IconButton
                size="small"
                onClick={onAddSubnode}
                sx={{ 
                  color: 'success.main',
                  '&:hover': { backgroundColor: 'success.light', color: 'white' },
                }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Drag to move" placement="top">
            <IconButton
              size="small"
              sx={{ 
                color: 'text.secondary',
                cursor: 'grab',
                '&:hover': { backgroundColor: 'grey.200' },
              }}
            >
              <DragIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete" placement="top">
            <IconButton
              size="small"
              onClick={onDelete}
              sx={{ 
                color: 'error.main',
                '&:hover': { backgroundColor: 'error.light', color: 'white' },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Paper>
      </Box>

      {/* Comment Dialog */}
      <Dialog 
        open={commentDialog.open} 
        onClose={() => setCommentDialog({ open: false, comment: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {node.comment ? 'Edit Comment' : 'Add Comment'} - {node.name}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            placeholder="Enter your comment here..."
            value={commentDialog.comment}
            onChange={(e) => setCommentDialog(prev => ({ ...prev, comment: e.target.value }))}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialog({ open: false, comment: '' })}>
            Cancel
          </Button>
          <Button onClick={handleCommentSave} variant="contained">
            {node.comment ? 'Update' : 'Add'} Comment
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default HoverToolbar; 