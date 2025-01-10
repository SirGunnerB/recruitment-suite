import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Timeline as TimelineIcon,
  Psychology as PsychologyIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { ThreeDChart } from '../visualizations/ThreeDimensionalCharts';
import { AdvancedMLEngine } from '../../../utils/analytics/advanced-ml';

interface DecisionData {
  candidateId: string;
  roleId: string;
  decision: 'hire' | 'reject' | 'further_review';
  confidence: number;
  reasoning: string[];
  nextSteps: string[];
}

interface CareerData {
  employeeId: string;
  currentRole: string;
  predictedPaths: {
    path: string[];
    probability: number;
    timeframe: number;
    requirements: string[];
  }[];
  recommendations: string[];
}

interface SkillData {
  skill: string;
  relevance: number;
  difficulty: number;
  timeToMaster: number;
  prerequisites: string[];
  resources: string[];
}

export const AutomatedDecisionDashboard: React.FC = () => {
  const theme = useTheme();
  const mlEngine = AdvancedMLEngine.getInstance();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decisionData, setDecisionData] = useState<DecisionData | null>(null);
  const [careerData, setCareerData] = useState<CareerData | null>(null);
  const [skillData, setSkillData] = useState<SkillData[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load hiring decision data
      const decision = await mlEngine.makeHiringDecision('candidate1', 'role1');
      setDecisionData({
        candidateId: 'candidate1',
        roleId: 'role1',
        ...decision,
      });

      // Load career path data
      const careerPath = await mlEngine.predictCareerPath('employee1', 'Software Engineer');
      setCareerData({
        employeeId: 'employee1',
        ...careerPath,
      });

      // Load skill recommendations
      const skills = await mlEngine.recommendSkills('employee1', 'Senior Engineer');
      setSkillData(skills);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecisionConfirmation = async () => {
    try {
      // Implement decision confirmation logic
      setConfirmDialogOpen(false);
      // Update status and notify relevant parties
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Custom chart data transformations
  const careerPathToChartData = (career: CareerData) => {
    return career.predictedPaths.map((path, index) => ({
      x: index * 2,
      y: path.probability * 10,
      z: path.timeframe,
      label: path.path[path.path.length - 1],
      value: path.probability,
      color: theme.palette.primary.main,
    }));
  };

  const skillsToChartData = (skills: SkillData[]) => {
    return skills.map((skill, index) => ({
      x: index * 2,
      y: skill.relevance * 10,
      z: skill.difficulty * 5,
      label: skill.skill,
      value: skill.relevance,
      color: theme.palette.secondary.main,
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Hiring Decision Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Automated Hiring Decision
              </Typography>
              
              {decisionData && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Chip
                      icon={
                        decisionData.decision === 'hire' ? (
                          <CheckCircleIcon />
                        ) : decisionData.decision === 'reject' ? (
                          <CancelIcon />
                        ) : (
                          <WarningIcon />
                        )
                      }
                      label={decisionData.decision.toUpperCase()}
                      color={
                        decisionData.decision === 'hire'
                          ? 'success'
                          : decisionData.decision === 'reject'
                          ? 'error'
                          : 'warning'
                      }
                      sx={{ mr: 2 }}
                    />
                    <Typography variant="body2">
                      Confidence: {(decisionData.confidence * 100).toFixed(1)}%
                    </Typography>
                  </Box>

                  <Typography variant="subtitle2" gutterBottom>
                    Reasoning:
                  </Typography>
                  <List dense>
                    {decisionData.reasoning.map((reason, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <PsychologyIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={reason} />
                      </ListItem>
                    ))}
                  </List>

                  <Typography variant="subtitle2" gutterBottom>
                    Next Steps:
                  </Typography>
                  <List dense>
                    {decisionData.nextSteps.map((step, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <TimelineIcon color="secondary" />
                        </ListItemIcon>
                        <ListItemText primary={step} />
                      </ListItem>
                    ))}
                  </List>

                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => setConfirmDialogOpen(true)}
                      disabled={loading}
                    >
                      Confirm Decision
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Career Path Prediction Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Career Path Prediction
              </Typography>
              
              {careerData && (
                <>
                  <Box sx={{ height: 400 }}>
                    <ThreeDChart
                      data={careerPathToChartData(careerData)}
                      type="3d-network"
                      animated
                      interactive
                    />
                  </Box>

                  <Typography variant="subtitle2" gutterBottom>
                    Recommended Paths:
                  </Typography>
                  <List dense>
                    {careerData.predictedPaths.map((path, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <TrendingUpIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={path.path.join(' → ')}
                          secondary={`Probability: ${(path.probability * 100).toFixed(
                            1
                          )}% | Timeframe: ${path.timeframe} years`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Skill Recommendations Section */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Skill Recommendations
              </Typography>
              
              {skillData.length > 0 && (
                <>
                  <Box sx={{ height: 500 }}>
                    <ThreeDChart
                      data={skillsToChartData(skillData)}
                      type="3d-scatter"
                      animated
                      interactive
                    />
                  </Box>

                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    {skillData.map((skill, index) => (
                      <Grid item xs={12} md={4} key={index}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                              {skill.skill}
                            </Typography>
                            
                            <Box sx={{ mb: 1 }}>
                              <Chip
                                icon={<SchoolIcon />}
                                label={`${skill.timeToMaster} months to master`}
                                size="small"
                                sx={{ mr: 1 }}
                              />
                              <Chip
                                label={`Relevance: ${(skill.relevance * 100).toFixed(1)}%`}
                                size="small"
                                color="primary"
                              />
                            </Box>

                            <Typography variant="body2" gutterBottom>
                              Prerequisites:
                            </Typography>
                            <Box sx={{ mb: 1 }}>
                              {skill.prerequisites.map((prereq, i) => (
                                <Chip
                                  key={i}
                                  label={prereq}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                            </Box>

                            <Typography variant="body2" gutterBottom>
                              Resources:
                            </Typography>
                            <List dense>
                              {skill.resources.map((resource, i) => (
                                <ListItem key={i}>
                                  <ListItemText primary={resource} />
                                </ListItem>
                              ))}
                            </List>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirm Decision</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to confirm this automated decision?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action will trigger the next steps in the process.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDecisionConfirmation}
            variant="contained"
            color="primary"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
