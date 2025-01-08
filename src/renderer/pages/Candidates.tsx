import React, { useState } from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { CandidateForm } from '../components/candidates/CandidateForm';
import { CandidateList } from '../components/candidates/CandidateList';
import { Candidate } from '../../database/db';

export const CandidatesPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

  const handleEdit = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setShowForm(true);
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingCandidate(null);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Candidates
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'Add Candidate'}
          </Button>
        </Box>

        {showForm && (
          <Box sx={{ mb: 4 }}>
            <CandidateForm
              onSubmit={handleFormSubmit}
              initialData={editingCandidate || undefined}
            />
          </Box>
        )}

        <CandidateList onEdit={handleEdit} />
      </Box>
    </Container>
  );
};
