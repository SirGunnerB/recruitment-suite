import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PredictiveReports } from '../../../renderer/components/reports/PredictiveReports';
import { SecurityManager } from '../../../utils/security/advanced-security';
import { DataRecoveryManager } from '../../../utils/recovery/data-recovery';

// Mock the managers
jest.mock('../../../utils/security/advanced-security');
jest.mock('../../../utils/recovery/data-recovery');

describe('PredictiveReports Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders all prediction sections', () => {
    render(<PredictiveReports />);
    
    expect(screen.getByTestId('hiring-forecast')).toBeInTheDocument();
    expect(screen.getByTestId('attrition-risk')).toBeInTheDocument();
    expect(screen.getByTestId('skill-gap')).toBeInTheDocument();
    expect(screen.getByTestId('market-trends')).toBeInTheDocument();
  });

  test('hiring forecast calculation works correctly', async () => {
    render(<PredictiveReports />);
    
    const calculateButton = screen.getByTestId('calculate-forecast');
    fireEvent.click(calculateButton);

    await waitFor(() => {
      const forecast = screen.getByTestId('forecast-result');
      expect(forecast).toHaveTextContent(/Predicted hiring needs/i);
    });
  });

  test('attrition risk analysis identifies high-risk employees', async () => {
    render(<PredictiveReports />);
    
    const analyzeButton = screen.getByTestId('analyze-attrition');
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      const riskList = screen.getByTestId('high-risk-employees');
      expect(riskList).toBeInTheDocument();
    });
  });

  test('skill gap analysis generates recommendations', async () => {
    render(<PredictiveReports />);
    
    const analyzeButton = screen.getByTestId('analyze-skills');
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      const recommendations = screen.getByTestId('skill-recommendations');
      expect(recommendations).toBeInTheDocument();
    });
  });

  test('market trends analysis shows salary predictions', async () => {
    render(<PredictiveReports />);
    
    const analyzeButton = screen.getByTestId('analyze-market');
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      const salaryTrends = screen.getByTestId('salary-predictions');
      expect(salaryTrends).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    // Mock API failure
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<PredictiveReports />);
    
    const calculateButton = screen.getByTestId('calculate-forecast');
    fireEvent.click(calculateButton);

    await waitFor(() => {
      const errorMessage = screen.getByTestId('error-message');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  test('updates predictions when date range changes', async () => {
    render(<PredictiveReports />);
    
    const dateRangeSelect = screen.getByTestId('date-range-select');
    fireEvent.change(dateRangeSelect, { target: { value: '6months' } });

    await waitFor(() => {
      const forecast = screen.getByTestId('forecast-result');
      expect(forecast).toHaveTextContent(/6 month projection/i);
    });
  });
});
