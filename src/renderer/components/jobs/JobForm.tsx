import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { db, Job } from '../../../database/db';

interface JobFormProps {
  onSubmit?: (job: Job) => void;
  initialData?: Partial<Job>;
}

export const JobForm: React.FC<JobFormProps> = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    requirements: initialData?.requirements || [],
    location: initialData?.location || '',
    salary: initialData?.salary || '',
    status: initialData?.status || 'active',
  });
  const [newRequirement, setNewRequirement] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRequirementAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newRequirement.trim()) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, newRequirement.trim()],
      });
      setNewRequirement('');
    }
  };

  const handleRequirementDelete = (reqToDelete: string) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((req) => req !== reqToDelete),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const job: Partial<Job> = {
      ...formData,
      createdAt: new Date(),
    };

    try {
      const id = await db.jobs.add(job as Job);
      if (onSubmit) {
        onSubmit({ ...job, id } as Job);
      }
      // Reset form
      setFormData({
        title: '',
        description: '',
        requirements: [],
        location: '',
        salary: '',
        status: 'active',
      });
    } catch (error) {
      console.error('Error adding job:', error);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {initialData ? 'Edit Job' : 'Add New Job'}
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            required
            name="title"
            label="Job Title"
            value={formData.title}
            onChange={handleChange}
          />
          <TextField
            required
            name="description"
            label="Job Description"
            multiline
            rows={4}
            value={formData.description}
            onChange={handleChange}
          />
          <TextField
            name="newRequirement"
            label="Add Requirements (Press Enter)"
            value={newRequirement}
            onChange={(e) => setNewRequirement(e.target.value)}
            onKeyPress={handleRequirementAdd}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {formData.requirements.map((req) => (
              <Chip
                key={req}
                label={req}
                onDelete={() => handleRequirementDelete(req)}
              />
            ))}
          </Box>
          <TextField
            required
            name="location"
            label="Location"
            value={formData.location}
            onChange={handleChange}
          />
          <TextField
            required
            name="salary"
            label="Salary Range"
            value={formData.salary}
            onChange={handleChange}
          />
          <FormControl>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              label="Status"
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Job['status'] })}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="filled">Filled</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>
          <Button type="submit" variant="contained">
            {initialData ? 'Update Job' : 'Add Job'}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};
