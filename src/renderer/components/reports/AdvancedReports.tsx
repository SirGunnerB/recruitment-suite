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
  TextField,
  Button,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { db } from '../../../database/db';
import { useLiveQuery } from 'dexie-react-hooks';

interface ReportFilters {
  startDate: Date | null;
  endDate: Date | null;
  department?: string;
  status?: string;
  minAmount?: number;
}

export const AdvancedReports: React.FC = () => {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: null,
    endDate: null,
  });

  // Recruitment Performance Report
  const performanceData = useLiveQuery(async () => {
    const candidates = await db.candidates.toArray();
    const filteredCandidates = candidates.filter(candidate => {
      const candidateDate = new Date(candidate.createdAt);
      return (!filters.startDate || candidateDate >= filters.startDate) &&
        (!filters.endDate || candidateDate <= filters.endDate);
    });

    const totalCandidates = filteredCandidates.length;
    const hiredCandidates = filteredCandidates.filter(c => c.status === 'hired').length;
    const interviewedCandidates = filteredCandidates.filter(c => c.status === 'interviewed').length;

    return {
      totalCandidates,
      hiredCandidates,
      interviewedCandidates,
      conversionRate: totalCandidates ? (hiredCandidates / totalCandidates) * 100 : 0,
      interviewRate: totalCandidates ? (interviewedCandidates / totalCandidates) * 100 : 0,
    };
  }, [filters.startDate, filters.endDate]);

  // Financial Performance Report
  const financialData = useLiveQuery(async () => {
    const invoices = await db.invoices.toArray();
    const filteredInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.createdAt);
      return (!filters.startDate || invoiceDate >= filters.startDate) &&
        (!filters.endDate || invoiceDate <= filters.endDate) &&
        (!filters.minAmount || invoice.amount >= filters.minAmount);
    });

    const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidRevenue = filteredInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
    const outstandingRevenue = filteredInvoices
      .filter(inv => inv.status !== 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    return {
      totalRevenue,
      paidRevenue,
      outstandingRevenue,
      invoiceCount: filteredInvoices.length,
      averageInvoiceAmount: filteredInvoices.length ? totalRevenue / filteredInvoices.length : 0,
    };
  }, [filters.startDate, filters.endDate, filters.minAmount]);

  // Skills and Requirements Analysis
  const skillsData = useLiveQuery(async () => {
    const candidates = await db.candidates.toArray();
    const jobs = await db.jobs.toArray();

    // Aggregate all skills
    const skillsCount = candidates.reduce((acc, candidate) => {
      candidate.skills.forEach(skill => {
        acc[skill] = (acc[skill] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // Aggregate job requirements
    const requirementsCount = jobs.reduce((acc, job) => {
      job.requirements.forEach(req => {
        acc[req] = (acc[req] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return {
      topSkills: Object.entries(skillsCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10),
      topRequirements: Object.entries(requirementsCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10),
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <Box>
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker
              label="Start Date"
              value={filters.startDate}
              onChange={(date) => setFilters({ ...filters, startDate: date })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker
              label="End Date"
              value={filters.endDate}
              onChange={(date) => setFilters({ ...filters, endDate: date })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Minimum Amount"
              type="number"
              value={filters.minAmount || ''}
              onChange={(e) => setFilters({ ...filters, minAmount: Number(e.target.value) })}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => setFilters({ startDate: null, endDate: null })}
            >
              Reset Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Recruitment Performance */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Recruitment Performance
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="textSecondary">
              Total Candidates
            </Typography>
            <Typography variant="h4">
              {performanceData?.totalCandidates}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="textSecondary">
              Hired Candidates
            </Typography>
            <Typography variant="h4">
              {performanceData?.hiredCandidates}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="textSecondary">
              Conversion Rate
            </Typography>
            <Typography variant="h4">
              {formatPercentage(performanceData?.conversionRate || 0)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" color="textSecondary">
              Interview Rate
            </Typography>
            <Typography variant="h4">
              {formatPercentage(performanceData?.interviewRate || 0)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Financial Performance */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Financial Performance
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="textSecondary">
              Total Revenue
            </Typography>
            <Typography variant="h4">
              {formatCurrency(financialData?.totalRevenue || 0)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="textSecondary">
              Paid Revenue
            </Typography>
            <Typography variant="h4">
              {formatCurrency(financialData?.paidRevenue || 0)}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" color="textSecondary">
              Outstanding Revenue
            </Typography>
            <Typography variant="h4">
              {formatCurrency(financialData?.outstandingRevenue || 0)}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Skills Analysis */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top 10 Candidate Skills
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Skill</TableCell>
                    <TableCell align="right">Count</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {skillsData?.topSkills.map(([skill, count]) => (
                    <TableRow key={skill}>
                      <TableCell>{skill}</TableCell>
                      <TableCell align="right">{count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Top 10 Job Requirements
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Requirement</TableCell>
                    <TableCell align="right">Count</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {skillsData?.topRequirements.map(([requirement, count]) => (
                    <TableRow key={requirement}>
                      <TableCell>{requirement}</TableCell>
                      <TableCell align="right">{count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
