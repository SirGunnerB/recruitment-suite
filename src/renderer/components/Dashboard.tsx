import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  Container,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  ExitToApp as LogoutIcon,
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../database/db';
import { MetricCard } from './dashboard/MetricCard';
import { DashboardCharts } from './dashboard/DashboardCharts';

const drawerWidth = 240;

export const Dashboard: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch metrics data
  const metrics = useLiveQuery(async () => {
    const [candidates, jobs, clients, invoices] = await Promise.all([
      db.candidates.count(),
      db.jobs.count(),
      db.clients.count(),
      db.invoices.toArray(),
    ]);

    const totalRevenue = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const paidRevenue = paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);

    return {
      totalCandidates: candidates,
      activeJobs: jobs,
      totalClients: clients,
      revenue: totalRevenue,
      paidRevenue,
    };
  });

  // Fetch chart data
  const chartData = useLiveQuery(async () => {
    const [candidates, invoices] = await Promise.all([
      db.candidates.toArray(),
      db.invoices.toArray(),
    ]);

    // Calculate candidate status distribution
    const statusCount = candidates.reduce((acc, candidate) => {
      acc[candidate.status] = (acc[candidate.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const candidateStatus = Object.entries(statusCount).map(([name, value]) => ({
      name,
      value,
    }));

    // Calculate monthly revenue
    const monthlyRevenue = invoices.reduce((acc, invoice) => {
      const month = new Date(invoice.createdAt).toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + invoice.amount;
      return acc;
    }, {} as Record<string, number>);

    const revenue = Object.entries(monthlyRevenue).map(([month, amount]) => ({
      month,
      amount,
    }));

    // Mock placement data (you may want to add a placements table in your database)
    const placements = [
      { name: 'IT', value: 35 },
      { name: 'Sales', value: 25 },
      { name: 'Marketing', value: 20 },
      { name: 'Finance', value: 20 },
    ];

    return {
      placements,
      revenue,
      candidateStatus,
    };
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { text: 'Candidates', icon: <PersonIcon />, path: '/candidates' },
    { text: 'Jobs', icon: <WorkIcon />, path: '/jobs' },
    { text: 'Clients', icon: <BusinessIcon />, path: '/clients' },
    { text: 'Invoices', icon: <ReceiptIcon />, path: '/invoices' },
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Recruitment CRM
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => navigate(item.path)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Container maxWidth="lg">
          {/* Metrics Grid */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Total Candidates"
                value={metrics?.totalCandidates || 0}
                icon={<PeopleIcon />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Active Jobs"
                value={metrics?.activeJobs || 0}
                icon={<WorkIcon />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Total Clients"
                value={metrics?.totalClients || 0}
                icon={<BusinessIcon />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Revenue"
                value={new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                }).format(metrics?.revenue || 0)}
                icon={<MoneyIcon />}
                trend={{
                  value: 12,
                  isPositive: true,
                }}
              />
            </Grid>
          </Grid>

          {/* Charts */}
          {chartData && <DashboardCharts data={chartData} />}
        </Container>
      </Box>
    </Box>
  );
};
