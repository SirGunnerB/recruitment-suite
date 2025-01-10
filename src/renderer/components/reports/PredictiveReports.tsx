import React from 'react';
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
  SelectChangeEvent,
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
} from 'recharts';
import { db } from '../../../database/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Candidate, Job, CandidateStatus, calculateDemand } from '../../../types';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { LoadingState } from '../common/LoadingState';
import { createLogger } from '../../../utils/logger';
import { errorTracker } from '../../../utils/errorTracking';
import { performanceMonitor } from '../../../utils/performance';
import { globalCache } from '../../../utils/cache';

const logger = createLogger('predictive-reports');

interface ExtendedCandidate extends Candidate {
  gap?: number;
}

interface ExtendedJob extends Job {
  demand?: number;
}

interface DemandData {
  demand: number;
  job: Job;
}

interface SkillGapData {
  skill: string;
  recommendation: string;
  gap: number;
}

interface ForecastData {
  historicalTrends: Array<{
    month: string;
    count: number;
    trend: number;
  }>;
  projectedHires: Array<{
    month: string;
    projected: number;
  }>;
  confidenceScore: number;
}

interface AttritionData {
  highRisk: RiskFactor[];
  mediumRisk: RiskFactor[];
  lowRisk: RiskFactor[];
}

interface RiskFactor {
  id: string;
  name: string;
  riskScore: number;
  factors: string[];
}

interface SkillGapAnalysis {
  skillGaps: Array<{
    skill: string;
    required: number;
    current: number;
    gap: number;
  }>;
  recommendations: SkillGapData[];
}

interface MarketTrendsData {
  salaryTrends: Array<{
    title: string;
    currentSalary: number;
    trend: number;
  }>;
  demandTrends: DemandData[];
  competitionAnalysis: Record<string, {
    applications: number;
    competitionScore: number;
  }>;
  recommendations: Array<{
    type: string;
    title: string;
    recommendation: string;
  }>;
}

interface PredictiveReportsState {
  timeframe: string;
  isLoading: boolean;
  error: string | null;
  forecastData: ForecastData | null;
  attritionData: AttritionData | null;
  skillGapData: SkillGapAnalysis | null;
  marketTrendsData: MarketTrendsData | null;
}

export class PredictiveReports extends React.Component<{}, PredictiveReportsState> {
  private unmounted = false;

  state: PredictiveReportsState = {
    timeframe: '6months',
    isLoading: true,
    error: null,
    forecastData: null,
    attritionData: null,
    skillGapData: null,
    marketTrendsData: null,
  };

  async componentDidMount() {
    try {
      await this.loadData();
    } catch (error) {
      if (!this.unmounted) {
        this.setState({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load data'
        });
      }
    }
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  private async loadData() {
    performanceMonitor.startMeasure('predictive-reports-load');
    
    try {
      const [demandTrends, forecast, attrition, skillGaps, marketTrends] = await Promise.all([
        this.analyzeDemandTrends(),
        this.analyzeHiringForecast(),
        this.analyzeAttritionRisk(),
        this.analyzeSkillGaps(),
        this.analyzeMarketTrends()
      ]);

      if (!this.unmounted) {
        this.setState({
          isLoading: false,
          forecastData: forecast.success ? forecast.data : null,
          attritionData: attrition.success ? attrition.data : null,
          skillGapData: skillGaps.success ? skillGaps.data : null,
          marketTrendsData: marketTrends.success ? marketTrends.data : null,
          error: [demandTrends, forecast, attrition, skillGaps, marketTrends]
            .filter(result => !result.success)
            .map(result => !result.success ? result.error : '')
            .filter(Boolean)
            .join(', ') || null
        });
      }
    } catch (error) {
      logger.error('Error loading predictive reports:', error);
      if (!this.unmounted) {
        this.setState({
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load data'
        });
      }
    } finally {
      performanceMonitor.endMeasure('predictive-reports-load');
    }
  }

  private async analyzeHiringForecast(): Promise<{ success: true; data: ForecastData } | { success: false; error: string }> {
    try {
      const cacheKey = `hiring-forecast-${this.state.timeframe}`;
      const cachedData = globalCache.get<ForecastData>(cacheKey);
      
      if (cachedData) {
        return { success: true, data: cachedData };
      }

      // Implement forecast analysis logic here
      const data: ForecastData = {
        historicalTrends: [],
        projectedHires: [],
        confidenceScore: 0.85
      };

      globalCache.set(cacheKey, data, 5 * 60 * 1000);
      return { success: true, data };
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logger.error('Error analyzing hiring forecast:', err);
      errorTracker.trackError(err, { component: 'PredictiveReports', action: 'analyzeHiringForecast' });
      return { success: false, error: err.message };
    }
  }

  private async analyzeAttritionRisk(): Promise<{ success: true; data: AttritionData } | { success: false; error: string }> {
    try {
      const cacheKey = 'attrition-risk';
      const cachedData = globalCache.get<AttritionData>(cacheKey);
      
      if (cachedData) {
        return { success: true, data: cachedData };
      }

      // Implement attrition risk analysis logic here
      const data: AttritionData = {
        highRisk: [],
        mediumRisk: [],
        lowRisk: []
      };

      globalCache.set(cacheKey, data, 5 * 60 * 1000);
      return { success: true, data };
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logger.error('Error analyzing attrition risk:', err);
      errorTracker.trackError(err, { component: 'PredictiveReports', action: 'analyzeAttritionRisk' });
      return { success: false, error: err.message };
    }
  }

  private async analyzeSkillGaps(): Promise<{ success: true; data: SkillGapAnalysis } | { success: false; error: string }> {
    try {
      const cacheKey = 'skill-gaps';
      const cachedData = globalCache.get<SkillGapAnalysis>(cacheKey);
      
      if (cachedData) {
        return { success: true, data: cachedData };
      }

      // Implement skill gap analysis logic here
      const data: SkillGapAnalysis = {
        skillGaps: [],
        recommendations: []
      };

      globalCache.set(cacheKey, data, 5 * 60 * 1000);
      return { success: true, data };
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logger.error('Error analyzing skill gaps:', err);
      errorTracker.trackError(err, { component: 'PredictiveReports', action: 'analyzeSkillGaps' });
      return { success: false, error: err.message };
    }
  }

  private async analyzeMarketTrends(): Promise<{ success: true; data: MarketTrendsData } | { success: false; error: string }> {
    try {
      const cacheKey = 'market-trends';
      const cachedData = globalCache.get<MarketTrendsData>(cacheKey);
      
      if (cachedData) {
        return { success: true, data: cachedData };
      }

      // Implement market trends analysis logic here
      const data: MarketTrendsData = {
        salaryTrends: [],
        demandTrends: [],
        competitionAnalysis: {},
        recommendations: []
      };

      globalCache.set(cacheKey, data, 5 * 60 * 1000);
      return { success: true, data };
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logger.error('Error analyzing market trends:', err);
      errorTracker.trackError(err, { component: 'PredictiveReports', action: 'analyzeMarketTrends' });
      return { success: false, error: err.message };
    }
  }

  private async analyzeDemandTrends(): Promise<{ success: true; data: DemandData[] } | { success: false; error: string }> {
    const cacheKey = 'demand-trends';
    const cachedData = globalCache.get<DemandData[]>(cacheKey);
    
    if (cachedData) {
      logger.debug('Using cached demand trends data');
      return { success: true, data: cachedData };
    }

    try {
      logger.info('Analyzing demand trends');
      performanceMonitor.startMeasure('demand-trends-analysis');

      const jobs = await db.jobs.toArray();
      const demandData: DemandData[] = jobs.map(dbJob => {
        // Convert database job type to types/index.ts Job type
        const job: Job = {
          id: dbJob.id?.toString() || '',
          title: dbJob.title,
          department: dbJob.title.split(' ')[0], // Extract department from title as fallback
          location: dbJob.location,
          status: dbJob.status === 'active' ? 'open' : 
                 dbJob.status === 'filled' ? 'filled' : 'cancelled',
          postedDate: dbJob.createdAt, // Use createdAt as postedDate
          requirements: dbJob.requirements || [],
          salary: typeof dbJob.salary === 'string' 
            ? { min: 0, max: parseInt(dbJob.salary) || 0, currency: 'USD' }
            : { min: 0, max: 0, currency: 'USD' }
        };
        
        return {
          demand: calculateDemand(job),
          job
        };
      });

      globalCache.set(cacheKey, demandData, 5 * 60 * 1000);
      performanceMonitor.endMeasure('demand-trends-analysis');
      
      return { success: true, data: demandData };
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      logger.error('Error analyzing demand trends:', err);
      errorTracker.trackError(err, { component: 'PredictiveReports', action: 'analyzeDemandTrends' });
      return { success: false, error: err.message };
    }
  }

  private handleTimeframeChange = (event: SelectChangeEvent<string>) => {
    const timeframe = event.target.value;
    this.setState({ timeframe }, () => {
      void this.loadData();
    });
  };

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Component error:', error);
    errorTracker.trackError(error, {
      component: 'PredictiveReports',
      errorInfo
    });
    this.setState({ error: error.message });
  }

  render() {
    const { isLoading, error, timeframe, forecastData, attritionData, skillGapData, marketTrendsData } = this.state;

    if (isLoading) {
      return <LoadingState message="Loading predictive reports..." />;
    }

    if (error) {
      return (
        <div className="error-message">
          <Typography variant="h6" color="error" gutterBottom>
            Error loading report
          </Typography>
          <Typography color="error">{error}</Typography>
          <Button variant="contained" onClick={() => void this.loadData()}>
            Retry
          </Button>
        </div>
      );
    }

    return (
      <ErrorBoundary>
        <Box className="predictive-reports">
          <Box mb={3}>
            <FormControl>
              <InputLabel>Timeframe</InputLabel>
              <Select value={timeframe} onChange={this.handleTimeframeChange}>
                <MenuItem value="3months">3 Months</MenuItem>
                <MenuItem value="6months">6 Months</MenuItem>
                <MenuItem value="12months">12 Months</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Grid container spacing={3}>
            {/* Hiring Forecast */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Hiring Forecast
                </Typography>
                {forecastData && (
                  <>
                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                      Confidence Score: {(forecastData.confidenceScore * 100).toFixed(1)}%
                    </Typography>
                    <Box height={300}>
                      <ResponsiveContainer>
                        <LineChart data={forecastData.projectedHires}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="projected" stroke="#8884d8" />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </>
                )}
              </Paper>
            </Grid>

            {/* Attrition Risk */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Attrition Risk Analysis
                </Typography>
                {attritionData && (
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
                          <TableCell>{attritionData.highRisk.length}</TableCell>
                          <TableCell>Immediate intervention needed</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Medium Risk</TableCell>
                          <TableCell>{attritionData.mediumRisk.length}</TableCell>
                          <TableCell>Monitor closely</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Low Risk</TableCell>
                          <TableCell>{attritionData.lowRisk.length}</TableCell>
                          <TableCell>Regular engagement</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Grid>

            {/* Skill Gaps */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Critical Skill Gaps
                </Typography>
                {skillGapData && (
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
                        {skillGapData.recommendations.map((rec, index) => (
                          <TableRow key={index}>
                            <TableCell>{rec.skill}</TableCell>
                            <TableCell>{rec.gap}</TableCell>
                            <TableCell>{rec.recommendation}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </Grid>

            {/* Market Trends */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Market Trends Analysis
                </Typography>
                {marketTrendsData && (
                  <Grid container spacing={2}>
                    {marketTrendsData.recommendations.map((rec, index) => (
                      <Grid item xs={12} md={4} key={index}>
                        <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                          <Typography variant="subtitle1" gutterBottom>
                            {rec.title}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {rec.recommendation}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </ErrorBoundary>
    );
  }
}
