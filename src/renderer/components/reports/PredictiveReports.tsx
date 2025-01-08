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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { db } from '../../../database/db';
import { useLiveQuery } from 'dexie-react-hooks';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const PredictiveReports: React.FC = () => {
  const [timeframe, setTimeframe] = useState('6months');

  // Hiring Forecast
  const forecastData = useLiveQuery(async () => {
    const [candidates, jobs, hires] = await Promise.all([
      db.candidates.toArray(),
      db.jobs.toArray(),
      db.candidates.where('status').equals('hired').toArray(),
    ]);

    // Calculate historical hiring patterns
    const hiringTrends = hires.reduce((acc, hire) => {
      const month = new Date(hire.hireDate).toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate seasonal patterns
    const seasonalPatterns = Object.entries(hiringTrends).map(([month, count]) => ({
      month,
      count,
      trend: calculateTrend(count, hiringTrends),
    }));

    // Project future hiring needs
    const projectedHires = calculateProjectedHires(seasonalPatterns, jobs);

    return {
      historicalTrends: seasonalPatterns,
      projectedHires,
      confidenceScore: calculateConfidenceScore(seasonalPatterns),
    };
  }, [timeframe]);

  // Attrition Risk Analysis
  const attritionData = useLiveQuery(async () => {
    const employees = await db.candidates.where('status').equals('hired').toArray();

    const riskFactors = employees.map(emp => ({
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      riskScore: calculateAttritionRisk(emp),
      factors: identifyRiskFactors(emp),
    }));

    return {
      highRisk: riskFactors.filter(r => r.riskScore > 0.7),
      mediumRisk: riskFactors.filter(r => r.riskScore > 0.4 && r.riskScore <= 0.7),
      lowRisk: riskFactors.filter(r => r.riskScore <= 0.4),
    };
  }, []);

  // Skill Gap Analysis
  const skillGapData = useLiveQuery(async () => {
    const [employees, jobs] = await Promise.all([
      db.candidates.where('status').equals('hired').toArray(),
      db.jobs.toArray(),
    ]);

    // Current skill inventory
    const currentSkills = employees.reduce((acc, emp) => {
      emp.skills.forEach(skill => {
        acc[skill] = (acc[skill] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // Required skills from job postings
    const requiredSkills = jobs.reduce((acc, job) => {
      job.requirements.forEach(req => {
        acc[req] = (acc[req] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // Calculate gaps
    const skillGaps = Object.entries(requiredSkills).map(([skill, required]) => ({
      skill,
      required,
      current: currentSkills[skill] || 0,
      gap: required - (currentSkills[skill] || 0),
    }));

    return {
      skillGaps: skillGaps.filter(gap => gap.gap > 0),
      recommendations: generateSkillRecommendations(skillGaps),
    };
  }, []);

  // Market Trends Analysis
  const marketTrendsData = useLiveQuery(async () => {
    const [jobs, candidates, placements] = await Promise.all([
      db.jobs.toArray(),
      db.candidates.toArray(),
      db.candidates.where('status').equals('hired').toArray(),
    ]);

    // Salary trends
    const salaryTrends = analyzeSalaryTrends(jobs, placements);

    // Demand trends
    const demandTrends = analyzeDemandTrends(jobs, candidates);

    // Competition analysis
    const competitionAnalysis = analyzeCompetition(jobs, candidates);

    return {
      salaryTrends,
      demandTrends,
      competitionAnalysis,
      recommendations: generateMarketRecommendations({
        salaryTrends,
        demandTrends,
        competitionAnalysis,
      }),
    };
  }, []);

  // Helper functions
  const calculateTrend = (current: number, historical: Record<string, number>): number => {
    const values = Object.values(historical);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return (current - avg) / avg;
  };

  const calculateProjectedHires = (
    patterns: Array<{ month: string; count: number; trend: number }>,
    jobs: any[]
  ) => {
    const openPositions = jobs.filter(j => j.status === 'active').length;
    const avgHiringTime = calculateAverageHiringTime();
    const seasonalFactor = calculateSeasonalFactor(patterns);

    return patterns.map(p => ({
      month: p.month,
      projected: Math.round(openPositions * seasonalFactor * (1 + p.trend)),
    }));
  };

  const calculateConfidenceScore = (patterns: any[]): number => {
    // Implement confidence score calculation based on data consistency
    return 0.85; // Placeholder
  };

  const calculateAttritionRisk = (employee: any): number => {
    let riskScore = 0;
    
    // Tenure
    const tenureMonths = calculateTenureMonths(employee.hireDate);
    if (tenureMonths < 12) riskScore += 0.2;
    else if (tenureMonths > 36) riskScore += 0.1;

    // Performance
    if (employee.performance && employee.performance < 3) riskScore += 0.3;

    // Salary competitiveness
    if (employee.salary && employee.salary < calculateMarketRate(employee.title)) {
      riskScore += 0.25;
    }

    // Work-life balance
    if (employee.overtimeHours && employee.overtimeHours > 10) riskScore += 0.15;

    return Math.min(riskScore, 1);
  };

  const identifyRiskFactors = (employee: any): string[] => {
    const factors = [];
    
    if (calculateTenureMonths(employee.hireDate) < 12) {
      factors.push('New hire risk');
    }
    
    if (employee.performance && employee.performance < 3) {
      factors.push('Performance concerns');
    }
    
    if (employee.salary && employee.salary < calculateMarketRate(employee.title)) {
      factors.push('Below market compensation');
    }
    
    if (employee.overtimeHours && employee.overtimeHours > 10) {
      factors.push('High overtime hours');
    }

    return factors;
  };

  const generateSkillRecommendations = (gaps: any[]) => {
    return gaps
      .filter(gap => gap.gap > 0)
      .map(gap => ({
        skill: gap.skill,
        recommendation: gap.gap > 5 
          ? 'Urgent hiring needed'
          : gap.gap > 2
          ? 'Consider training programs'
          : 'Monitor skill development',
      }));
  };

  const analyzeSalaryTrends = (jobs: any[], placements: any[]) => {
    // Group by job title and calculate average salary changes
    const trends = jobs.reduce((acc, job) => {
      if (!acc[job.title]) {
        acc[job.title] = {
          current: job.salary.max,
          historical: [],
        };
      }
      acc[job.title].historical.push(job.salary.max);
      return acc;
    }, {} as Record<string, { current: number; historical: number[] }>);

    return Object.entries(trends).map(([title, data]) => ({
      title,
      currentSalary: data.current,
      trend: calculateSalaryTrend(data.historical),
    }));
  };

  const analyzeDemandTrends = (jobs: any[], candidates: any[]) => {
    // Calculate demand by comparing job openings to qualified candidates
    return jobs.reduce((acc, job) => {
      const qualifiedCandidates = candidates.filter(c => 
        job.requirements.every(req => c.skills.includes(req))
      ).length;

      acc[job.title] = {
        openings: 1,
        candidates: qualifiedCandidates,
        demandScore: qualifiedCandidates > 0 ? 1 / qualifiedCandidates : 1,
      };
      return acc;
    }, {} as Record<string, { openings: number; candidates: number; demandScore: number }>);
  };

  const analyzeCompetition = (jobs: any[], candidates: any[]) => {
    // Analyze competition for different roles
    return jobs.reduce((acc, job) => {
      const applications = candidates.filter(c => 
        c.appliedJobs && c.appliedJobs.includes(job.id)
      ).length;

      acc[job.title] = {
        applications,
        competitionScore: applications > 0 ? applications / job.openings : 0,
      };
      return acc;
    }, {} as Record<string, { applications: number; competitionScore: number }>);
  };

  const generateMarketRecommendations = (data: any) => {
    const recommendations = [];

    // Salary recommendations
    for (const trend of data.salaryTrends) {
      if (trend.trend < -0.05) {
        recommendations.push({
          type: 'salary',
          title: trend.title,
          message: 'Consider salary adjustment to match market trends',
        });
      }
    }

    // Demand recommendations
    for (const [title, demand] of Object.entries(data.demandTrends)) {
      if (demand.demandScore > 0.8) {
        recommendations.push({
          type: 'demand',
          title,
          message: 'High demand role - consider proactive recruiting',
        });
      }
    }

    return recommendations;
  };

  // Utility functions
  const calculateTenureMonths = (hireDate: string): number => {
    return Math.floor(
      (new Date().getTime() - new Date(hireDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
  };

  const calculateMarketRate = (title: string): number => {
    // Implement market rate calculation
    return 100000; // Placeholder
  };

  const calculateAverageHiringTime = (): number => {
    // Implement average hiring time calculation
    return 45; // Placeholder
  };

  const calculateSeasonalFactor = (patterns: any[]): number => {
    // Implement seasonal factor calculation
    return 1.1; // Placeholder
  };

  const calculateSalaryTrend = (historical: number[]): number => {
    if (historical.length < 2) return 0;
    const oldest = historical[0];
    const newest = historical[historical.length - 1];
    return (newest - oldest) / oldest;
  };

  return (
    <Box>
      <Grid container spacing={3}>
        {/* Hiring Forecast */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Hiring Forecast
              <Typography variant="subtitle2" color="textSecondary">
                Confidence Score: {(forecastData?.confidenceScore || 0) * 100}%
              </Typography>
            </Typography>
            <Box height={300}>
              <ResponsiveContainer>
                <LineChart data={forecastData?.projectedHires || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="projected" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Attrition Risk */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Attrition Risk Analysis
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Risk Level</TableCell>
                    <TableCell>Count</TableCell>
                    <TableCell>Action Required</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>High Risk</TableCell>
                    <TableCell>{attritionData?.highRisk.length || 0}</TableCell>
                    <TableCell>Immediate intervention needed</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Medium Risk</TableCell>
                    <TableCell>{attritionData?.mediumRisk.length || 0}</TableCell>
                    <TableCell>Monitor closely</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Low Risk</TableCell>
                    <TableCell>{attritionData?.lowRisk.length || 0}</TableCell>
                    <TableCell>Regular engagement</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Skill Gaps */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Critical Skill Gaps
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Skill</TableCell>
                    <TableCell>Gap</TableCell>
                    <TableCell>Recommendation</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {skillGapData?.recommendations.map((rec, index) => (
                    <TableRow key={index}>
                      <TableCell>{rec.skill}</TableCell>
                      <TableCell>{rec.gap}</TableCell>
                      <TableCell>{rec.recommendation}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Market Trends */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Market Trends Analysis
            </Typography>
            <Grid container spacing={2}>
              {marketTrendsData?.recommendations.map((rec, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {rec.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {rec.message}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
