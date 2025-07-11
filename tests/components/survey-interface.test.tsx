import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SurveyInterface } from '@/components/survey/survey-interface';
import { createApiTestSuite } from '../utils/api-test-utils';

// Mock the survey interface component test
describe('SurveyInterface Component', () => {
  const apiTest = createApiTestSuite();
  const mockSurvey = apiTest.testSurveys.minimal;

  beforeEach(() => {
    // Clear any existing localStorage
    localStorage.clear();
  });

  it('should render stakeholder selection initially', () => {
    render(
      <SurveyInterface 
        survey={mockSurvey}
        organizationId="test-org"
      />
    );

    expect(screen.getByText('Select Your Role')).toBeInTheDocument();
    expect(screen.getByText('CEO')).toBeInTheDocument();
    expect(screen.getByText('Tech Lead')).toBeInTheDocument();
  });

  it('should show survey questions after stakeholder selection', async () => {
    render(
      <SurveyInterface 
        survey={mockSurvey}
        organizationId="test-org"
      />
    );

    // Click on CEO stakeholder
    const ceoButton = screen.getByText('CEO');
    fireEvent.click(ceoButton);

    // Click continue button
    const continueButton = screen.getByText('Continue to Survey');
    fireEvent.click(continueButton);

    // Wait for survey questions to appear
    await waitFor(() => {
      expect(screen.getByText('What is your primary challenge?')).toBeInTheDocument();
    });
  });

  it('should handle back navigation', async () => {
    render(
      <SurveyInterface 
        survey={mockSurvey}
        organizationId="test-org"
      />
    );

    // Select stakeholder and proceed
    fireEvent.click(screen.getByText('CEO'));
    fireEvent.click(screen.getByText('Continue to Survey'));

    // Wait for questions to appear
    await waitFor(() => {
      expect(screen.getByText('What is your primary challenge?')).toBeInTheDocument();
    });

    // Find and click back button
    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);

    // Should return to stakeholder selection
    await waitFor(() => {
      expect(screen.getByText('Select Your Role')).toBeInTheDocument();
    });
  });

  it('should persist stakeholder selection in localStorage', () => {
    render(
      <SurveyInterface 
        survey={mockSurvey}
        organizationId="test-org"
      />
    );

    // Select CEO
    fireEvent.click(screen.getByText('CEO'));

    // Check localStorage
    const storedData = localStorage.getItem('survey-state');
    expect(storedData).toBeTruthy();
    
    const parsedData = JSON.parse(storedData!);
    expect(parsedData.stakeholder).toBe('ceo');
  });

  it('should restore state from localStorage', () => {
    // Pre-populate localStorage
    const surveyState = {
      stakeholder: 'tech-lead',
      expertise: ['infrastructure'],
      currentSurvey: mockSurvey,
      organizationId: 'test-org'
    };
    localStorage.setItem('survey-state', JSON.stringify(surveyState));

    render(
      <SurveyInterface 
        survey={mockSurvey}
        organizationId="test-org"
      />
    );

    // Should skip stakeholder selection and show questions
    expect(screen.queryByText('Select Your Role')).not.toBeInTheDocument();
    expect(screen.getByText('What is your primary challenge?')).toBeInTheDocument();
  });

  it('should handle survey completion', async () => {
    render(
      <SurveyInterface 
        survey={mockSurvey}
        organizationId="test-org"
      />
    );

    // Complete the survey flow
    fireEvent.click(screen.getByText('CEO'));
    fireEvent.click(screen.getByText('Continue to Survey'));

    await waitFor(() => {
      expect(screen.getByText('What is your primary challenge?')).toBeInTheDocument();
    });

    // Fill out the form
    const textInput = screen.getByLabelText('What is your primary challenge?');
    fireEvent.change(textInput, { target: { value: 'Digital transformation' } });

    const radioButton = screen.getByLabelText('Good');
    fireEvent.click(radioButton);

    // Submit the form
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    // Should show completion message
    await waitFor(() => {
      expect(screen.getByText('Survey Complete')).toBeInTheDocument();
    });
  });
});