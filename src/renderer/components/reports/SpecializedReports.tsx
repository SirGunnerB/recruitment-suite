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
import { Candidate, Job, CandidateStatus } from '../../../types';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { LoadingState } from '../common/LoadingState';
import { useAsyncData } from '../../../hooks/useAsyncData';
import { useDebounce } from '../../../hooks/useDebounce';

interface EnhancedCandidate extends Candidate {
  gender: string;
  ethnicity: string;
  veteranStatus: string;
  source: string;
  sourcingCost: number;
  department: string;
  hireDate: Date;
  appliedDate: Date;
}

interface EnhancedJob extends Job {
  filledDate: Date;
  postedDate: Date;
}

const mapDbCandidate = (c: any): Candidate => ({
  id: c.id?.toString() || '',
  firstName: c.firstName,
  lastName: c.lastName,
  email: c.email,
  phone: c.phone || '',
  status: c.status as CandidateStatus,
  gender: c.gender || '',
  ethnicity: c.ethnicity || '',
  veteranStatus: c.veteranStatus || '',
  source: c.source || '',
  sourcingCost: c.sourcingCost || 0,
  department: c.department || '',
  hireDate: c.hireDate,
  appliedDate: c.appliedDate || new Date(),
  updatedAt: c.updatedAt || new Date()
});

const mapDbJob = (j: any): Job => ({
  id: j.id?.toString() || '',
  title: j.title,
  department: j.department || '',
  location: j.location,
  status: j.status === 'filled' ? 'filled' : j.status === 'open' ? 'open' : 'cancelled',
  postedDate: j.postedDate || new Date(),
  filledDate: j.filledDate,
  requirements: j.requirements || [],
  salary: j.salary || { min: 0, max: 0, currency: 'USD' }
});

export const SpecializedReports: React.FC = () => {
  const [reportType, setReportType] = useState('pipeline');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Pipeline Analysis Report
  const { data: pipelineData, isLoading: isPipelineLoading, error: pipelineError } = useAsyncData(
    async () => {
      const dbCandidates = await db.candidates.toArray();
      const candidates = dbCandidates.map(mapDbCandidate);

      const pipelineStages = {
        applied: candidates.filter(c => c.status === CandidateStatus.Applied).length,
        screened: candidates.filter(c => c.status === CandidateStatus.Screened).length,
        interviewed: candidates.filter(c => c.status === CandidateStatus.Interviewed).length,
        offered: candidates.filter(c => c.status === CandidateStatus.Offered).length,
        hired: candidates.filter(c => c.status === CandidateStatus.Hired).length,
        rejected: candidates.filter(c => c.status === CandidateStatus.Rejected).length,
      };

      const timeToHire = candidates
        .filter(c => c.status === CandidateStatus.Hired && c.hireDate)
        .map(c => ({
          days: Math.floor((c.hireDate!.getTime() - c.appliedDate.getTime()) / (1000 * 60 * 60 * 24)),
          candidate: c,
        }));

      const avgTimeToHire = timeToHire.length > 0 
        ? timeToHire.reduce((sum, curr) => sum + curr.days, 0) / timeToHire.length
        : 0;

      return {
        pipelineStages,
        timeToHire,
        avgTimeToHire,
      };
    },
    [debouncedSearchTerm]
  );

  // Diversity and Inclusion Report
  const { data: diversityData, isLoading: isDiversityLoading, error: diversityError } = useAsyncData(
    async () => {
      const dbCandidates = await db.candidates.toArray();
      const candidates = dbCandidates.map(mapDbCandidate);
      const hired = candidates.filter(c => c.status === CandidateStatus.Hired);

      const calculateDiversityMetrics = (candidates: Candidate[]) => {
        const metrics = {
          gender: new Map<string, number>(),
          ethnicity: new Map<string, number>(),
          veteranStatus: new Map<string, number>()
        };

        candidates.forEach(candidate => {
          metrics.gender.set(
            candidate.gender,
            (metrics.gender.get(candidate.gender) || 0) + 1
          );
          metrics.ethnicity.set(
            candidate.ethnicity,
            (metrics.ethnicity.get(candidate.ethnicity) || 0) + 1
          );
          metrics.veteranStatus.set(
            candidate.veteranStatus,
            (metrics.veteranStatus.get(candidate.veteranStatus) || 0) + 1
          );
        });

        return metrics;
      };

      const diversityMetrics = calculateDiversityMetrics(hired);

      const genderDistribution = Object.fromEntries(diversityMetrics.gender);
      const ethnicityDistribution = Object.fromEntries(diversityMetrics.ethnicity);
      const veteranStatus = Object.fromEntries(diversityMetrics.veteranStatus);

      return {
        genderDistribution,
        ethnicityDistribution,
        veteranStatus,
      };
    },
    [debouncedSearchTerm]
  );

  // Cost Analysis Report
  const { data: costData, isLoading: isCostLoading, error: costError } = useAsyncData(
    async () => {
      const [candidates, jobs, invoices] = await Promise.all([
        db.candidates.toArray(),
        db.jobs.toArray(),
        db.invoices.toArray(),
      ]);

      const calculateTimeToFill = (jobs: Job[]) => {
        return jobs
          .filter(job => job.filledDate && job.postedDate)
          .map(job => ({
            timeToFill: Math.floor((new Date(job.filledDate).getTime() - new Date(job.postedDate).getTime()) / (1000 * 60 * 60 * 24)),
            job
          }));
      };

      const jobFillTime = calculateTimeToFill(jobs.map(mapDbJob));

      const costPerHire = invoices.reduce((sum, inv) => sum + inv.amount, 0) / 
        candidates.filter(c => c.status === CandidateStatus.Hired).length;

      const avgJobFillTime = jobFillTime.reduce((sum, curr) => sum + curr.timeToFill, 0) / jobFillTime.length;

      const calculateSourceEffectiveness = (candidates: Candidate[]) => {
        return candidates.reduce((acc, c) => {
          if (c.status === CandidateStatus.Hired) {
            const source = c.source || 'Unknown';
            acc[source] = {
              hires: (acc[source]?.hires || 0) + 1,
              cost: (acc[source]?.cost || 0) + (c.sourcingCost || 0),
            };
          }
          return acc;
        }, {} as Record<string, { hires: number; cost: number }>);
      };

      const sourceEffectiveness = calculateSourceEffectiveness(candidates.map(mapDbCandidate));

      return {
        costPerHire,
        avgJobFillTime,
        sourceEffectiveness,
      };
    },
    [debouncedSearchTerm]
  );

  // Retention Analysis Report
  const { data: retentionData, isLoading: isRetentionLoading, error: retentionError } = useAsyncData(
    async () => {
      const candidates = await db.candidates.toArray();
      const hired = candidates.filter(c => c.status === CandidateStatus.Hired && c.hireDate);

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

      const calculateRetentionByDepartment = (candidates: Candidate[]) => {
        return candidates
          .filter(c => c.status === CandidateStatus.Hired && c.department)
          .reduce((acc, c) => {
            const dept = c.department;
            acc[dept] = (acc[dept] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
      };

      const retentionByDepartment = calculateRetentionByDepartment(hired);

      return {
        retentionByPeriod,
        retentionByDepartment,
      };
    },
    [debouncedSearchTerm]
  );

  if (isPipelineLoading || isDiversityLoading || isCostLoading || isRetentionLoading) {
    return <LoadingState message="Loading specialized reports..." />;
  }

  if (pipelineError || diversityError || costError || retentionError) {
    return (
      <div className="error-message">
        <h3>Error loading report</h3>
        <p>{pipelineError?.message || diversityError?.message || costError?.message || retentionError?.message}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

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
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
};
