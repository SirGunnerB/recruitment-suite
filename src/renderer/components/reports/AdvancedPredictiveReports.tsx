import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Alert,
  Tab,
  Tabs,
  TextField,
  Autocomplete,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { AdvancedAnalytics } from '../../../utils/analytics/advanced-analytics';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface SkillGap {
  skill: string;
  gap: number;
  current: number;
  required: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const AdvancedPredictiveReports: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Candidate Success Prediction
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [candidatePrediction, setCandidatePrediction] = useState<any>(null);
  
  // Team Performance
  const [teamPerformance, setTeamPerformance] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<number>(6);
  
  // Skill Gaps
  const [skillGaps, setSkillGaps] = useState<any>(null);
  const [upcomingProjects, setUpcomingProjects] = useState<string[]>([]);

  const analytics = AdvancedAnalytics.getInstance();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const predictCandidateSuccess = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const prediction = await analytics.predictCandidateSuccess(
        selectedCandidate,
        selectedRole,
        selectedTeam
      );
      
      setCandidatePrediction(prediction);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const forecastTeamPerformance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const forecast = await analytics.forecastTeamPerformance(
        selectedTeam,
        timeframe
      );
      
      setTeamPerformance(forecast);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const predictSkillGaps = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const gaps = await analytics.predictSkillGaps(
        selectedTeam,
        upcomingProjects
      );
      
      setSkillGaps(gaps);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processSkillGaps = (data: [string, number][]): SkillGap[] => {
    return data.map(([skill, gap]) => ({
      skill,
      gap,
      current: calculateCurrentLevel(skill),
      required: calculateRequiredLevel(skill)
    }));
  };

  const calculateCurrentLevel = (skill: string) => {
    // Implement logic to calculate current level
    return 0;
  };

  const calculateRequiredLevel = (skill: string) => {
    // Implement logic to calculate required level
    return 0;
  };

  return (
    <Box sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        aria-label="analytics tabs"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        <Tab label="Candidate Success Prediction" />
        <Tab label="Team Performance Forecast" />
        <Tab label="Skill Gap Analysis" />
      </Tabs>

      {/* Candidate Success Prediction */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Input Parameters
                </Typography>
                
                <Autocomplete
                  options={[]} // Add candidate options
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Candidate"
                      margin="normal"
                    />
                  )}
                  onChange={(_, value) => setSelectedCandidate(value)}
                />
                
                <TextField
                  select
                  label="Select Role"
                  fullWidth
                  margin="normal"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                />
                
                <TextField
                  select
                  label="Select Team"
                  fullWidth
                  margin="normal"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                />
                
                <Button
                  variant="contained"
                  fullWidth
                  onClick={predictCandidateSuccess}
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Predict Success'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            {candidatePrediction && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Prediction Results
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1">
                      Success Probability:
                    </Typography>
                    <CircularProgress
                      variant="determinate"
                      value={candidatePrediction.successProbability * 100}
                      size={80}
                    />
                    <Typography variant="h4">
                      {Math.round(candidatePrediction.successProbability * 100)}%
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1">Risk Factors:</Typography>
                    {candidatePrediction.riskFactors.map((risk: string) => (
                      <Chip
                        key={risk}
                        label={risk}
                        color="warning"
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>

                  <Box>
                    <Typography variant="subtitle1">Recommendations:</Typography>
                    <List>
                      {candidatePrediction.recommendations.map((rec: string) => (
                        <ListItem key={rec}>
                          <ListItemText primary={rec} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      {/* Team Performance Forecast */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Forecast Parameters
                </Typography>
                
                <TextField
                  select
                  label="Select Team"
                  fullWidth
                  margin="normal"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                />
                
                <TextField
                  type="number"
                  label="Timeframe (months)"
                  fullWidth
                  margin="normal"
                  value={timeframe}
                  onChange={(e) => setTimeframe(Number(e.target.value))}
                />
                
                <Button
                  variant="contained"
                  fullWidth
                  onClick={forecastTeamPerformance}
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Generate Forecast'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            {teamPerformance && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Performance Forecast
                  </Typography>
                  
                  <Box sx={{ height: 300, mb: 3 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={teamPerformance.performanceTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="productivity"
                          fill="#8884d8"
                          name="Productivity"
                        />
                        <Bar
                          dataKey="qualityMetrics"
                          fill="#82ca9d"
                          name="Quality"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1">Bottlenecks:</Typography>
                    {teamPerformance.bottlenecks.map((bottleneck: string) => (
                      <Chip
                        key={bottleneck}
                        label={bottleneck}
                        color="error"
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>

                  <Box>
                    <Typography variant="subtitle1">
                      Improvement Areas:
                    </Typography>
                    <List>
                      {teamPerformance.improvementAreas.map((area: string) => (
                        <ListItem key={area}>
                          <ListItemText primary={area} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </TabPanel>

      {/* Skill Gap Analysis */}
      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Analysis Parameters
                </Typography>
                
                <TextField
                  select
                  label="Select Team"
                  fullWidth
                  margin="normal"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                />
                
                <Autocomplete
                  multiple
                  options={[]} // Add project options
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Upcoming Projects"
                      margin="normal"
                    />
                  )}
                  onChange={(_, value) => setUpcomingProjects(value)}
                />
                
                <Button
                  variant="contained"
                  fullWidth
                  onClick={predictSkillGaps}
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Analyze Skill Gaps'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            {skillGaps && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Skill Gap Analysis
                  </Typography>
                  
                  <Box sx={{ height: 300, mb: 3 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart
                        cx="50%"
                        cy="50%"
                        outerRadius="80%"
                        data={processSkillGaps(Array.from(skillGaps.gaps.entries()))}
                      >
                        <PolarGrid />
                        <PolarAngleAxis dataKey="skill" />
                        <PolarRadiusAxis />
                        <Radar
                          name="Current Skills"
                          dataKey="current"
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.6}
                        />
                        <Radar
                          name="Required Skills"
                          dataKey="required"
                          stroke="#82ca9d"
                          fill="#82ca9d"
                          fillOpacity={0.6}
                        />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1">
                        Training Recommendations:
                      </Typography>
                      <List>
                        {skillGaps.recommendations.training.map(
                          (rec: string) => (
                            <ListItem key={rec}>
                              <ListItemText primary={rec} />
                            </ListItem>
                          )
                        )}
                      </List>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle1">
                        Hiring Recommendations:
                      </Typography>
                      <List>
                        {skillGaps.recommendations.hiring.map((rec: string) => (
                          <ListItem key={rec}>
                            <ListItemText primary={rec} />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1">Timeline:</Typography>
                    <Timeline>
                      {skillGaps.recommendations.timeline.map(
                        (milestone: string) => (
                          <TimelineItem key={milestone}>
                            <TimelineSeparator>
                              <TimelineDot />
                              <TimelineConnector />
                            </TimelineSeparator>
                            <TimelineContent>{milestone}</TimelineContent>
                          </TimelineItem>
                        )
                      )}
                    </Timeline>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};
