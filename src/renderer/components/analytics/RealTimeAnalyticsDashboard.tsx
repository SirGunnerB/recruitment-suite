import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { RealTimeAnalytics } from '../../../utils/analytics/real-time-analytics';
import RefreshIcon from '@mui/icons-material/Refresh';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export const RealTimeAnalyticsDashboard: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const analyticsEngine = RealTimeAnalytics.getInstance();
  
  // State for different metrics
  const [retentionData, setRetentionData] = useState<any>(null);
  const [salaryData, setSalaryData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [engagementData, setEngagementData] = useState<any>(null);

  // Animation states
  const [animate, setAnimate] = useState(true);
  const chartRefs = useRef<{ [key: string]: any }>({});

  // Subscription cleanup
  useEffect(() => {
    const subscriptions: any[] = [];
    
    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, []);

  // Start real-time monitoring
  const startMonitoring = async () => {
    try {
      setLoading(true);
      setError(null);

      analyticsEngine.getRetentionMetrics().subscribe({
        next: (data) => setRetentionData(data),
        error: (err) => setError(err.message),
      });

      analyticsEngine.getSalaryMetrics().subscribe({
        next: (data) => setSalaryData(data),
        error: (err) => setError(err.message),
      });

      analyticsEngine.getPerformanceMetrics().subscribe({
        next: (data) => setPerformanceData(data),
        error: (err) => setError(err.message),
      });

      analyticsEngine.getEngagementMetrics().subscribe({
        next: (data) => setEngagementData(data),
        error: (err) => setError(err.message),
      });

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Custom chart components
  const RetentionChart = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Retention Risk Analysis</Typography>
          <IconButton onClick={() => setAnimate(true)}>
            <RefreshIcon />
          </IconButton>
        </Box>
        
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={retentionData?.historicalTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <RechartsTooltip />
            <Area
              type="monotone"
              dataKey="riskScore"
              stroke={theme.palette.primary.main}
              fill={theme.palette.primary.light}
              animationDuration={animate ? 1000 : 0}
            />
          </AreaChart>
        </ResponsiveContainer>

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Risk Factors:</Typography>
          {retentionData?.contributingFactors.map((factor: string) => (
            <Tooltip key={factor} title={factor}>
              <Button
                size="small"
                variant="outlined"
                sx={{ m: 0.5 }}
                color="warning"
              >
                {factor}
              </Button>
            </Tooltip>
          ))}
        </Box>
      </CardContent>
    </Card>
  );

  const SalaryChart = () => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Salary Optimization</Typography>
          <IconButton onClick={() => setAnimate(true)}>
            <RefreshIcon />
          </IconButton>
        </Box>
        
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="experience" name="Experience" />
            <YAxis dataKey="salary" name="Salary" />
            <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter
              name="Market Data"
              data={salaryData?.benchmarkData}
              fill={theme.palette.primary.main}
              animationDuration={animate ? 1000 : 0}
            />
            <Scatter
              name="Current Position"
              data={[{ experience: 5, salary: salaryData?.marketRate }]}
              fill={theme.palette.secondary.main}
              shape="star"
              animationDuration={animate ? 1000 : 0}
            />
          </ScatterChart>
        </ResponsiveContainer>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-around' }}>
          <Typography variant="body2">
            Competitiveness Score: {salaryData?.competitivenessScore}%
          </Typography>
          <Typography variant="body2">
            Recommended Adjustment: ${salaryData?.recommendedAdjustment}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );

  const RadarChart = ({ data }: { data: { name: string; value: number }[] }) => {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="name" />
          <PolarRadiusAxis />
          <Radar
            dataKey="value"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    );
  };

  const PerformanceChart = () => {
    const performanceMetrics = [
      { name: 'Productivity', value: performanceData?.productivityScore },
      { name: 'Quality', value: performanceData?.qualityScore },
      { name: 'Velocity', value: performanceData?.velocityTrend[0] },
      { name: 'Learning', value: performanceData?.learningRate },
    ];

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Performance Metrics</Typography>
            <IconButton onClick={() => setAnimate(true)}>
              <RefreshIcon />
            </IconButton>
          </Box>
          
          <RadarChart data={performanceMetrics} />

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Velocity Trend:</Typography>
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={performanceData?.velocityTrend}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={theme.palette.secondary.main}
                  dot={false}
                  animationDuration={animate ? 1000 : 0}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const EngagementChart = () => {
    const engagementIndicators = [
      {
        name: 'Participation',
        value: engagementData?.indicators.participation,
      },
      {
        name: 'Initiative',
        value: engagementData?.indicators.initiative,
      },
      {
        name: 'Collaboration',
        value: engagementData?.indicators.collaboration,
      },
    ];

    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Engagement Analysis</Typography>
            <IconButton onClick={() => setAnimate(true)}>
              <RefreshIcon />
            </IconButton>
          </Box>
          
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={engagementIndicators}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill={theme.palette.primary.main}
                animationDuration={animate ? 1000 : 0}
              >
                {engagementIndicators.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={[
                      theme.palette.primary.main,
                      theme.palette.secondary.main,
                      theme.palette.success.main,
                    ][index]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2">Engagement Trend:</Typography>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={engagementData?.trends}>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={theme.palette.primary.main}
                  fill={theme.palette.primary.light}
                  animationDuration={animate ? 1000 : 0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>
    );
  };

  useEffect(() => {
    analyticsEngine.getRetentionMetrics().subscribe({
      next: (data) => setRetentionData(data),
      error: (err) => setError(err.message),
    });

    analyticsEngine.getSalaryMetrics().subscribe({
      next: (data) => setSalaryData(data),
      error: (err) => setError(err.message),
    });

    analyticsEngine.getPerformanceMetrics().subscribe({
      next: (data) => setPerformanceData(data),
      error: (err) => setError(err.message),
    });

    analyticsEngine.getEngagementMetrics().subscribe({
      next: (data) => setEngagementData(data),
      error: (err) => setError(err.message),
    });
  }, [analyticsEngine]);

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h4">Real-Time Analytics Dashboard</Typography>
        <Button
          variant="contained"
          startIcon={<TimelineIcon />}
          onClick={startMonitoring}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Start Monitoring'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <RetentionChart />
        </Grid>
        <Grid item xs={12} md={6}>
          <SalaryChart />
        </Grid>
        <Grid item xs={12} md={6}>
          <PerformanceChart />
        </Grid>
        <Grid item xs={12} md={6}>
          <EngagementChart />
        </Grid>
      </Grid>
    </Box>
  );
};
