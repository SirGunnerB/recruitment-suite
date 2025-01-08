import React from 'react';
import { Box, Paper, Typography, SxProps, Theme } from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactElement<SvgIconComponent>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  sx?: SxProps<Theme>;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  trend,
  sx = {},
}) => {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle2" color="textSecondary">
          {title}
        </Typography>
        <Box sx={{ color: 'primary.main' }}>{icon}</Box>
      </Box>
      <Typography variant="h4" component="div" sx={{ mb: 1 }}>
        {value}
      </Typography>
      {trend && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: trend.isPositive ? 'success.main' : 'error.main',
          }}
        >
          <Typography variant="body2">
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
            vs last month
          </Typography>
        </Box>
      )}
    </Paper>
  );
};
