import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import { db } from '../../../database/db';
import { useLiveQuery } from 'dexie-react-hooks';

export const SpecializedReports: React.FC = () => {
  const [reportType, setReportType] = useState('pipeline');

  // Pipeline Analysis Report
  const pipelineData = useLiveQuery(async () => {
    const candidates = await db.candidates.toArray();
    const jobs = await db.jobs.toArray();

    const pipelineStages = {
      applied: candidates.filter(c => c.status === 'applied').length,
      screened: candidates.filter(c => c.status === 'screened').length,
      interviewed: candidates.filter(c => c.status === 'interviewed').length,
      offered: candidates.filter(c => c.status === 'offered').length,
      hired: candidates.filter(c => c.status === 'hired').length,
      rejected: candidates.filter(c => c.status === 'rejected').length,
    };

    const timeToHire = candidates
      .filter(c => c.status === 'hired' && c.hireDate && c.appliedDate)
      .map(c => ({
        days: Math.floor((new Date(c.hireDate).getTime() - new Date(c.appliedDate).getTime()) / (1000 * 60 * 60 * 24)),
        candidate: c,
      }));

    const avgTimeToHire = timeToHire.reduce((sum, curr) => sum + curr.days, 0) / timeToHire.length;

    return {
      pipelineStages,
      avgTimeToHire,
      timeToHire,
    };
  }, []);

  // Diversity and Inclusion Report
  const diversityData = useLiveQuery(async () => {
    const candidates = await db.candidates.toArray();
    const hired = candidates.filter(c => c.status === 'hired');

    const genderDistribution = hired.reduce((acc, c) => {
      acc[c.gender] = (acc[c.gender] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ethnicityDistribution = hired.reduce((acc, c) => {
      acc[c.ethnicity] = (acc[c.ethnicity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const veteranStatus = hired.reduce((acc, c) => {
      acc[c.veteranStatus ? 'Veteran' : 'Non-Veteran'] = (acc[c.veteranStatus ? 'Veteran' : 'Non-Veteran'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      genderDistribution,
      ethnicityDistribution,
      veteranStatus,
    };
  }, []);

  // Cost Analysis Report
  const costData = useLiveQuery(async () => {
    const [candidates, jobs, invoices] = await Promise.all([
      db.candidates.toArray(),
      db.jobs.toArray(),
      db.invoices.toArray(),
    ]);

    const costPerHire = invoices.reduce((sum, inv) => sum + inv.amount, 0) / 
      candidates.filter(c => c.status === 'hired').length;

    const jobFillTime = jobs
      .filter(j => j.filledDate && j.postedDate)
      .map(j => ({
        days: Math.floor((new Date(j.filledDate).getTime() - new Date(j.postedDate).getTime()) / (1000 * 60 * 60 * 24)),
        job: j,
      }));

    const avgJobFillTime = jobFillTime.reduce((sum, curr) => sum + curr.days, 0) / jobFillTime.length;

    const sourceEffectiveness = candidates.reduce((acc, c) => {
      if (c.status === 'hired') {
        acc[c.source] = {
          hires: (acc[c.source]?.hires || 0) + 1,
          cost: (acc[c.source]?.cost || 0) + (c.sourcingCost || 0),
        };
      }
      return acc;
    }, {} as Record<string, { hires: number; cost: number }>);

    return {
      costPerHire,
      avgJobFillTime,
      sourceEffectiveness,
    };
  }, []);

  // Retention Analysis Report
  const retentionData = useLiveQuery(async () => {
    const candidates = await db.candidates.toArray();
    const hired = candidates.filter(c => c.status === 'hired' && c.hireDate);

    const retentionByPeriod = hired.reduce((acc, c) => {
      const hireDate = new Date(c.hireDate);
      const today = new Date();
      const monthsEmployed = (today.getFullYear() - hireDate.getFullYear()) * 12 + 
        today.getMonth() - hireDate.getMonth();

      if (monthsEmployed <= 3) acc['3_months'] = (acc['3_months'] || 0) + 1;
      if (monthsEmployed <= 6) acc['6_months'] = (acc['6_months'] || 0) + 1;
      if (monthsEmployed <= 12) acc['12_months'] = (acc['12_months'] || 0) + 1;

      return acc;
    }, {} as Record<string, number>);

    const retentionByDepartment = hired.reduce((acc, c) => {
      acc[c.department] = (acc[c.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      retentionByPeriod,
      retentionByDepartment,
    };
  }, []);

  const renderPipelineReport = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Timeline position="alternate">
            {Object.entries(pipelineData?.pipelineStages || {}).map(([stage, count], index) => (
              <TimelineItem key={stage}>
                <TimelineSeparator>
                  <TimelineDot color={index === 4 ? 'success' : 'primary'} />
                  {index < 5 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Typography variant="h6">{stage}</Typography>
                  <Typography>{count} candidates</Typography>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Time to Hire Analysis
            </Typography>
            <Typography>
              Average Time to Hire: {pipelineData?.avgTimeToHire?.toFixed(1) || 0} days
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const renderDiversityReport = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Gender Distribution
            </Typography>
            <Table>
              <TableBody>
                {Object.entries(diversityData?.genderDistribution || {}).map(([gender, count]) => (
                  <TableRow key={gender}>
                    <TableCell>{gender}</TableCell>
                    <TableCell align="right">{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Ethnicity Distribution
            </Typography>
            <Table>
              <TableBody>
                {Object.entries(diversityData?.ethnicityDistribution || {}).map(([ethnicity, count]) => (
                  <TableRow key={ethnicity}>
                    <TableCell>{ethnicity}</TableCell>
                    <TableCell align="right">{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Veteran Status
            </Typography>
            <Table>
              <TableBody>
                {Object.entries(diversityData?.veteranStatus || {}).map(([status, count]) => (
                  <TableRow key={status}>
                    <TableCell>{status}</TableCell>
                    <TableCell align="right">{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const renderCostReport = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Cost Metrics
            </Typography>
            <Typography>
              Average Cost per Hire: {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(costData?.costPerHire || 0)}
            </Typography>
            <Typography>
              Average Job Fill Time: {costData?.avgJobFillTime?.toFixed(1) || 0} days
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Source Effectiveness
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Source</TableCell>
                  <TableCell align="right">Hires</TableCell>
                  <TableCell align="right">Cost per Hire</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(costData?.sourceEffectiveness || {}).map(([source, data]) => (
                  <TableRow key={source}>
                    <TableCell>{source}</TableCell>
                    <TableCell align="right">{data.hires}</TableCell>
                    <TableCell align="right">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      }).format(data.cost / data.hires)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const renderRetentionReport = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Retention by Period
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell>
                  <TableCell align="right">Retained Employees</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(retentionData?.retentionByPeriod || {}).map(([period, count]) => (
                  <TableRow key={period}>
                    <TableCell>{period.replace('_', ' ')}</TableCell>
                    <TableCell align="right">{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Retention by Department
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Department</TableCell>
                  <TableCell align="right">Retained Employees</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(retentionData?.retentionByDepartment || {}).map(([dept, count]) => (
                  <TableRow key={dept}>
                    <TableCell>{dept}</TableCell>
                    <TableCell align="right">{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Report Type</InputLabel>
          <Select
            value={reportType}
            label="Report Type"
            onChange={(e) => setReportType(e.target.value)}
          >
            <MenuItem value="pipeline">Recruitment Pipeline</MenuItem>
            <MenuItem value="diversity">Diversity & Inclusion</MenuItem>
            <MenuItem value="cost">Cost Analysis</MenuItem>
            <MenuItem value="retention">Retention Analysis</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {reportType === 'pipeline' && renderPipelineReport()}
      {reportType === 'diversity' && renderDiversityReport()}
      {reportType === 'cost' && renderCostReport()}
      {reportType === 'retention' && renderRetentionReport()}
    </Box>
  );
};
