import React, { useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useFishboneData } from '../hooks/useFishboneData';

const FishboneCanvas = () => {
  const canvasRef = useRef(null);
  const { fishboneData } = useFishboneData();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    drawFishbone(ctx, canvas.width, canvas.height);
  }, [fishboneData]);

  const drawFishbone = (ctx, width, height) => {
    ctx.strokeStyle = '#6750A4';
    ctx.lineWidth = 3;
    ctx.font = '14px Roboto, sans-serif';
    ctx.fillStyle = '#1C1B1F';
    const centerY = height / 2;
    const spineStart = 100;
    const spineEnd = width - 200;
    ctx.beginPath();
    ctx.moveTo(spineStart, centerY);
    ctx.lineTo(spineEnd, centerY);
    ctx.stroke();
    ctx.fillStyle = '#E7E0EC';
    ctx.fillRect(spineEnd + 10, centerY - 30, 150, 60);
    ctx.strokeRect(spineEnd + 10, centerY - 30, 150, 60);
    ctx.fillStyle = '#1C1B1F';
    ctx.textAlign = 'center';
    const problemText = fishboneData.mainProblem || 'Main Problem';
    ctx.fillText(problemText, spineEnd + 85, centerY + 5);
  };

  return (
    <Box sx={{ flexGrow: 1, height: '100%', position: 'relative' }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
        Fishbone Diagram Visualization
      </Typography>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: 'calc(100% - 80px)',
          border: '2px solid #E7E0EC',
          borderRadius: '16px',
          backgroundColor: '#FFFFFF'
        }}
      />
    </Box>
  );
};

export default FishboneCanvas;
