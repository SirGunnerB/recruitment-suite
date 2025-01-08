import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { db } from '../../database/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Download as DownloadIcon } from '@mui/icons-material';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState('revenue');
  const [timeFrame, setTimeFrame] = useState('month');

  const reportData = useLiveQuery(async () => {
    const [candidates, jobs, clients, invoices] = await Promise.all([
      db.candidates.toArray(),
      db.jobs.toArray(),
      db.clients.toArray(),
      db.invoices.toArray(),
    ]);

    // Revenue by time period
    const revenueData = invoices.reduce((acc, invoice) => {
      const date = new Date(invoice.createdAt);
      const period = timeFrame === 'month'
        ? date.toLocaleString('default', { month: 'short' })
        : `Q${Math.floor(date.getMonth() / 3) + 1}`;
      acc[period] = (acc[period] || 0) + invoice.amount;
      return acc;
    }, {} as Record<string, number>);

    // Placement success rate
    const placementRate = {
      hired: candidates.filter(c => c.status === 'hired').length,
      rejected: candidates.filter(c => c.status === 'rejected').length,
      pending: candidates.filter(c => ['applied', 'interviewed'].includes(c.status)).length,
    };

    // Job statistics
    const jobStats = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Client engagement
    const clientEngagement = clients.reduce((acc, client) => {
      const clientInvoices = invoices.filter(i => i.clientId === client.id);
      acc[client.companyName] = clientInvoices.reduce((sum, i) => sum + i.amount, 0);
      return acc;
    }, {} as Record<string, number>);

    return {
      revenue: Object.entries(revenueData).map(([period, amount]) => ({
        period,
        amount,
      })),
      placementRate: Object.entries(placementRate).map(([name, value]) => ({
        name,
        value,
      })),
      jobStats: Object.entries(jobStats).map(([name, value]) => ({
        name,
        value,
      })),
      clientEngagement: Object.entries(clientEngagement)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({
          name,
          value,
        })),
    };
  }, [timeFrame]);

  const handleExport = () => {
    if (!reportData) return;

    const csvData = {
      revenue: reportData.revenue.map(item => `${item.period},${item.amount}`).join('\n'),
      placementRate: reportData.placementRate.map(item => `${item.name},${item.value}`).join('\n'),
      jobStats: reportData.jobStats.map(item => `${item.name},${item.value}`).join('\n'),
      clientEngagement: reportData.clientEngagement.map(item => `${item.name},${item.value}`).join('\n'),
    };

    const blob = new Blob([csvData[reportType as keyof typeof csvData]], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Reports
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Report Type</InputLabel>
              <Select
                value={reportType}
                label="Report Type"
                onChange={(e) => setReportType(e.target.value)}
              >
                <MenuItem value="revenue">Revenue</MenuItem>
                <MenuItem value="placementRate">Placement Rate</MenuItem>
                <MenuItem value="jobStats">Job Statistics</MenuItem>
                <MenuItem value="clientEngagement">Client Engagement</MenuItem>
              </Select>
            </FormControl>
            {reportType === 'revenue' && (
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Time Frame</InputLabel>
                <Select
                  value={timeFrame}
                  label="Time Frame"
                  onChange={(e) => setTimeFrame(e.target.value)}
                >
                  <MenuItem value="month">Monthly</MenuItem>
                  <MenuItem value="quarter">Quarterly</MenuItem>
                </Select>
              </FormControl>
            )}
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
            >
              Export
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {reportType === 'revenue' && reportData && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, height: 400 }}>
                <Typography variant="h6" gutterBottom>
                  Revenue Overview
                </Typography>
                <ResponsiveContainer>
                  <BarChart data={reportData.revenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) =>
                        new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(value)
                      }
                    />
                    <Bar dataKey="amount" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          )}

          {reportType === 'placementRate' && reportData && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: 400 }}>
                <Typography variant="h6" gutterBottom>
                  Placement Rate
                </Typography>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={reportData.placementRate}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reportData.placementRate.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          )}

          {reportType === 'jobStats' && reportData && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: 400 }}>
                <Typography variant="h6" gutterBottom>
                  Job Statistics
                </Typography>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={reportData.jobStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reportData.jobStats.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          )}

          {reportType === 'clientEngagement' && reportData && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Top 5 Clients by Revenue
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Client</TableCell>
                        <TableCell align="right">Total Revenue</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportData.clientEngagement.map((client) => (
                        <TableRow key={client.name}>
                          <TableCell>{client.name}</TableCell>
                          <TableCell align="right">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'USD',
                            }).format(client.value)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    </Container>
  );
};
