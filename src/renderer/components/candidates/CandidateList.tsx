import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { db, Candidate } from '../../../database/db';
import { useLiveQuery } from 'dexie-react-hooks';

interface CandidateListProps {
  onEdit?: (candidate: Candidate) => void;
}

export const CandidateList: React.FC<CandidateListProps> = ({ onEdit }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const candidates = useLiveQuery(
    async () => {
      if (!searchQuery) {
        return await db.candidates.toArray();
      }
      
      const query = searchQuery.toLowerCase();
      return await db.candidates
        .filter(candidate => 
          candidate.firstName.toLowerCase().includes(query) ||
          candidate.lastName.toLowerCase().includes(query) ||
          candidate.email.toLowerCase().includes(query) ||
          candidate.skills.some(skill => skill.toLowerCase().includes(query))
        )
        .toArray();
    },
    [searchQuery]
  );

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this candidate?')) {
      await db.candidates.delete(id);
    }
  };

  const getStatusColor = (status: Candidate['status']) => {
    switch (status) {
      case 'applied':
        return 'primary';
      case 'interviewed':
        return 'info';
      case 'hired':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search candidates..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Skills</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {candidates?.map((candidate) => (
              <TableRow key={candidate.id}>
                <TableCell>
                  {candidate.firstName} {candidate.lastName}
                </TableCell>
                <TableCell>{candidate.email}</TableCell>
                <TableCell>{candidate.phone}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {candidate.skills.map((skill) => (
                      <Chip
                        key={skill}
                        label={skill}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={candidate.status}
                    color={getStatusColor(candidate.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => onEdit?.(candidate)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => candidate.id && handleDelete(candidate.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
