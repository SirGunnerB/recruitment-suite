import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
} from '@mui/material';
import { db, Invoice, Client, Candidate } from '../../../database/db';
import { useLiveQuery } from 'dexie-react-hooks';

interface InvoiceFormProps {
  onSubmit?: (invoice: Invoice) => void;
  initialData?: Partial<Invoice>;
  preselectedClientId?: number;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  onSubmit,
  initialData,
  preselectedClientId,
}) => {
  const [formData, setFormData] = useState({
    clientId: initialData?.clientId || preselectedClientId || 0,
    candidateId: initialData?.candidateId || 0,
    amount: initialData?.amount || 0,
    status: initialData?.status || 'draft',
    dueDate: initialData?.dueDate
      ? new Date(initialData.dueDate).toISOString().split('T')[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const clients = useLiveQuery(() => db.clients.where('status').equals('active').toArray());
  const candidates = useLiveQuery(() => db.candidates.where('status').equals('hired').toArray());

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    const loadPreselectedClient = async () => {
      if (preselectedClientId) {
        const client = await db.clients.get(preselectedClientId);
        if (client) {
          setSelectedClient(client);
        }
      }
    };
    loadPreselectedClient();
  }, [preselectedClientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invoice: Partial<Invoice> = {
      ...formData,
      dueDate: new Date(formData.dueDate),
      createdAt: new Date(),
    };

    try {
      const id = await db.invoices.add(invoice as Invoice);
      if (onSubmit) {
        onSubmit({ ...invoice, id } as Invoice);
      }
      // Reset form
      setFormData({
        clientId: 0,
        candidateId: 0,
        amount: 0,
        status: 'draft',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      setSelectedClient(null);
      setSelectedCandidate(null);
    } catch (error) {
      console.error('Error adding invoice:', error);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {initialData ? 'Edit Invoice' : 'Create New Invoice'}
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <Autocomplete
            value={selectedClient}
            onChange={(_, newValue) => {
              setSelectedClient(newValue);
              setFormData(prev => ({ ...prev, clientId: newValue?.id || 0 }));
            }}
            options={clients || []}
            getOptionLabel={(option) => option.companyName}
            renderInput={(params) => (
              <TextField
                {...params}
                required
                label="Client"
                placeholder="Select client"
              />
            )}
          />

          <Autocomplete
            value={selectedCandidate}
            onChange={(_, newValue) => {
              setSelectedCandidate(newValue);
              setFormData(prev => ({ ...prev, candidateId: newValue?.id || 0 }));
            }}
            options={candidates || []}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
            renderInput={(params) => (
              <TextField
                {...params}
                required
                label="Candidate"
                placeholder="Select candidate"
              />
            )}
          />

          <TextField
            required
            name="amount"
            label="Amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
            }}
          />

          <TextField
            required
            name="dueDate"
            label="Due Date"
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            InputLabelProps={{
              shrink: true,
            }}
          />

          <FormControl>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              label="Status"
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Invoice['status'] })}
            >
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="sent">Sent</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
            </Select>
          </FormControl>

          <Button type="submit" variant="contained">
            {initialData ? 'Update Invoice' : 'Create Invoice'}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};
