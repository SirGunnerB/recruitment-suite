import React, { useState } from 'react';
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
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { db, Invoice } from '../../../database/db';
import { useLiveQuery } from 'dexie-react-hooks';

interface InvoiceListProps {
  onEdit?: (invoice: Invoice) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ onEdit }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const invoicesWithDetails = useLiveQuery(
    async () => {
      let invoices = await db.invoices.toArray();

      // Fetch related data for each invoice
      const invoicesWithDetails = await Promise.all(
        invoices.map(async (invoice) => {
          const client = await db.clients.get(invoice.clientId);
          const candidate = await db.candidates.get(invoice.candidateId);
          return {
            ...invoice,
            clientName: client?.companyName || 'Unknown Client',
            candidateName: candidate 
              ? `${candidate.firstName} ${candidate.lastName}`
              : 'Unknown Candidate',
          };
        })
      );

      if (!searchQuery) {
        return invoicesWithDetails;
      }

      const query = searchQuery.toLowerCase();
      return invoicesWithDetails.filter(
        (invoice) =>
          invoice.clientName.toLowerCase().includes(query) ||
          invoice.candidateName.toLowerCase().includes(query)
      );
    },
    [searchQuery]
  );

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      await db.invoices.delete(id);
    }
  };

  const getStatusColor = (status: Invoice['status']): "default" | "primary" | "success" | "error" => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'sent':
        return 'primary';
      case 'paid':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Box>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search invoices..."
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
              <TableCell>Invoice ID</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Candidate</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoicesWithDetails?.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <Typography variant="body2" color="textSecondary">
                    #{invoice.id}
                  </Typography>
                </TableCell>
                <TableCell>{invoice.clientName}</TableCell>
                <TableCell>{invoice.candidateName}</TableCell>
                <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                <TableCell>
                  <Chip
                    label={invoice.status}
                    color={getStatusColor(invoice.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => onEdit?.(invoice)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => invoice.id && handleDelete(invoice.id)}
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
