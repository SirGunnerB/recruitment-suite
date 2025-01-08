import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { db, Candidate } from '../../../database/db';

interface CandidateFormProps {
  onSubmit?: (candidate: Candidate) => void;
  initialData?: Partial<Candidate>;
}

export const CandidateForm: React.FC<CandidateFormProps> = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    skills: initialData?.skills || [],
    experience: initialData?.experience || '',
    status: initialData?.status || 'applied',
  });
  const [newSkill, setNewSkill] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSkillAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSkill.trim()) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const handleSkillDelete = (skillToDelete: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((skill) => skill !== skillToDelete),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const candidate: Partial<Candidate> = {
      ...formData,
      createdAt: new Date(),
    };

    try {
      const id = await db.candidates.add(candidate as Candidate);
      if (onSubmit) {
        onSubmit({ ...candidate, id } as Candidate);
      }
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        skills: [],
        experience: '',
        status: 'applied',
      });
    } catch (error) {
      console.error('Error adding candidate:', error);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {initialData ? 'Edit Candidate' : 'Add New Candidate'}
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            required
            name="firstName"
            label="First Name"
            value={formData.firstName}
            onChange={handleChange}
          />
          <TextField
            required
            name="lastName"
            label="Last Name"
            value={formData.lastName}
            onChange={handleChange}
          />
          <TextField
            required
            name="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange}
          />
          <TextField
            required
            name="phone"
            label="Phone"
            value={formData.phone}
            onChange={handleChange}
          />
          <TextField
            name="newSkill"
            label="Add Skills (Press Enter)"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={handleSkillAdd}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {formData.skills.map((skill) => (
              <Chip
                key={skill}
                label={skill}
                onDelete={() => handleSkillDelete(skill)}
              />
            ))}
          </Box>
          <TextField
            name="experience"
            label="Experience"
            multiline
            rows={4}
            value={formData.experience}
            onChange={handleChange}
          />
          <FormControl>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              label="Status"
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Candidate['status'] })}
            >
              <MenuItem value="applied">Applied</MenuItem>
              <MenuItem value="interviewed">Interviewed</MenuItem>
              <MenuItem value="hired">Hired</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
          <Button type="submit" variant="contained">
            {initialData ? 'Update Candidate' : 'Add Candidate'}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};
