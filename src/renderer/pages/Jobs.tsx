import React, { useState } from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { JobForm } from '../components/jobs/JobForm';
import { JobList } from '../components/jobs/JobList';
import { Job } from '../../database/db';

export const JobsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setShowForm(true);
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingJob(null);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Jobs
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'Add Job'}
          </Button>
        </Box>

        {showForm && (
          <Box sx={{ mb: 4 }}>
            <JobForm
              onSubmit={handleFormSubmit}
              initialData={editingJob || undefined}
            />
          </Box>
        )}

        <JobList onEdit={handleEdit} />
      </Box>
    </Container>
  );
};
