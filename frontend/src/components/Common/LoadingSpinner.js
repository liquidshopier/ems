import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { getText } from '../../utils/textConfig';

function LoadingSpinner({ message }) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
      }}
    >
      <CircularProgress color="primary" />
      <Typography variant="body2" sx={{ mt: 2 }}>
        {message || getText('common.loading', 'Loading...')}
      </Typography>
    </Box>
  );
}

export default LoadingSpinner;

