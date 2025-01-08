import React, { useState } from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { ClientForm } from '../components/clients/ClientForm';
import { ClientList } from '../components/clients/ClientList';
import { Client } from '../../database/db';

export const ClientsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingClient(null);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Clients
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'Add Client'}
          </Button>
        </Box>

        {showForm && (
          <Box sx={{ mb: 4 }}>
            <ClientForm
              onSubmit={handleFormSubmit}
              initialData={editingClient || undefined}
            />
          </Box>
        )}

        <ClientList onEdit={handleEdit} />
      </Box>
    </Container>
  );
};
