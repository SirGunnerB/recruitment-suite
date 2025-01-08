import React, { useState } from 'react';
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
} from '@mui/material';
import { db, Client } from '../../../database/db';

interface ClientFormProps {
  onSubmit?: (client: Client) => void;
  initialData?: Partial<Client>;
}

export const ClientForm: React.FC<ClientFormProps> = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    companyName: initialData?.companyName || '',
    contactPerson: initialData?.contactPerson || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    status: initialData?.status || 'active',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const client: Partial<Client> = {
      ...formData,
      createdAt: new Date(),
    };

    try {
      const id = await db.clients.add(client as Client);
      if (onSubmit) {
        onSubmit({ ...client, id } as Client);
      }
      // Reset form
      setFormData({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        status: 'active',
      });
    } catch (error) {
      console.error('Error adding client:', error);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {initialData ? 'Edit Client' : 'Add New Client'}
      </Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2}>
          <TextField
            required
            name="companyName"
            label="Company Name"
            value={formData.companyName}
            onChange={handleChange}
          />
          <TextField
            required
            name="contactPerson"
            label="Contact Person"
            value={formData.contactPerson}
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
            required
            name="address"
            label="Address"
            multiline
            rows={3}
            value={formData.address}
            onChange={handleChange}
          />
          <FormControl>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.status}
              label="Status"
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Client['status'] })}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          <Button type="submit" variant="contained">
            {initialData ? 'Update Client' : 'Add Client'}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
};
