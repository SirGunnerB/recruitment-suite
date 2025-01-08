import React, { useState, useEffect } from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { InvoiceForm } from '../components/invoices/InvoiceForm';
import { InvoiceList } from '../components/invoices/InvoiceList';
import { Invoice } from '../../database/db';
import { useLocation } from 'react-router-dom';

export const InvoicesPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [preselectedClientId, setPreselectedClientId] = useState<number | undefined>();
  
  const location = useLocation();

  useEffect(() => {
    // Check for clientId in URL params when creating a new invoice from client page
    const params = new URLSearchParams(location.search);
    const clientId = params.get('clientId');
    if (clientId) {
      setPreselectedClientId(Number(clientId));
      setShowForm(true);
    }
  }, [location]);

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setShowForm(true);
  };

  const handleFormSubmit = () => {
    setShowForm(false);
    setEditingInvoice(null);
    setPreselectedClientId(undefined);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" component="h1">
            Invoices
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'Create Invoice'}
          </Button>
        </Box>

        {showForm && (
          <Box sx={{ mb: 4 }}>
            <InvoiceForm
              onSubmit={handleFormSubmit}
              initialData={editingInvoice || undefined}
              preselectedClientId={preselectedClientId}
            />
          </Box>
        )}

        <InvoiceList onEdit={handleEdit} />
      </Box>
    </Container>
  );
};
