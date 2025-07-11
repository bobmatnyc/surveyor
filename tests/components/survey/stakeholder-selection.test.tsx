import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StakeholderSelection } from '@/components/survey/stakeholder-selection';
import { testUtils } from '@/tests/utils/unit-test-helpers';
import { unitTestFixtures } from '@/tests/fixtures/unit-test-fixtures';

// Mock external dependencies
vi.mock('@/lib/stakeholder-utils', () => ({
  validateStakeholderSelection: vi.fn(),
  getStakeholderRecommendations: vi.fn(),
  getExpertiseOptions: vi.fn(),
  formatExpertise: vi.fn(),
  stakeholderSelectionManager: {
    getState: vi.fn(),
    setStakeholder: vi.fn(),
    setExpertise: vi.fn(),
    reset: vi.fn(),
    isStakeholderValid: vi.fn(),
  },
}));

describe('StakeholderSelection Component', () => {
  const mockSurvey = unitTestFixtures.surveys.comprehensive;
  const mockOnSelect = vi.fn();
  const mockOnBack = vi.fn();

  // Mock implementations
  const mockValidateStakeholderSelection = vi.fn();
  const mockGetStakeholderRecommendations = vi.fn();
  const mockGetExpertiseOptions = vi.fn();
  const mockStakeholderSelectionManager = {
    getState: vi.fn(),
    setStakeholder: vi.fn(),
    setExpertise: vi.fn(),
    reset: vi.fn(),
    isStakeholderValid: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock returns
    mockValidateStakeholderSelection.mockReturnValue({ 
      isValid: true, 
      errors: [] 
    });
    mockGetStakeholderRecommendations.mockReturnValue([]);
    mockGetExpertiseOptions.mockReturnValue([
      'leadership', 'technology', 'strategy', 'development'
    ]);
    mockStakeholderSelectionManager.getState.mockReturnValue({
      selectedStakeholderId: '',
      selectedExpertise: [],
    });
    mockStakeholderSelectionManager.isStakeholderValid.mockReturnValue(true);
    
    // Mock the imports
    const stakeholderUtilsMock = vi.mocked(await import('@/lib/stakeholder-utils'));
    stakeholderUtilsMock.validateStakeholderSelection = mockValidateStakeholderSelection;
    stakeholderUtilsMock.getStakeholderRecommendations = mockGetStakeholderRecommendations;
    stakeholderUtilsMock.getExpertiseOptions = mockGetExpertiseOptions;
    stakeholderUtilsMock.stakeholderSelectionManager = mockStakeholderSelectionManager;
  });

  describe('Rendering', () => {
    it('renders with survey data', () => {
      render(
        <StakeholderSelection
          survey={mockSurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText(mockSurvey.title)).toBeInTheDocument();
      expect(screen.getByText(mockSurvey.description)).toBeInTheDocument();
      expect(screen.getByText('Select Your Role')).toBeInTheDocument();
      expect(screen.getByText('Areas of Expertise')).toBeInTheDocument();
    });

    it('renders all stakeholders', () => {
      render(
        <StakeholderSelection
          survey={mockSurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      mockSurvey.stakeholders.forEach((stakeholder) => {
        expect(screen.getByText(stakeholder.name)).toBeInTheDocument();
        expect(screen.getByText(stakeholder.description)).toBeInTheDocument();
      });
    });

    it('renders back button when onBack is provided', () => {
      render(
        <StakeholderSelection
          survey={mockSurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      const backButton = screen.getByText('Back to Survey Selection');
      expect(backButton).toBeInTheDocument();
    });

    it('does not render back button when onBack is not provided', () => {
      render(
        <StakeholderSelection
          survey={mockSurvey}
          onSelect={mockOnSelect}
        />
      );

      expect(screen.queryByText('Back to Survey Selection')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('shows error message when no stakeholders are available', () => {
      const emptySurvey = { ...mockSurvey, stakeholders: [] };
      
      render(
        <StakeholderSelection
          survey={emptySurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Survey Data Issue')).toBeInTheDocument();
      expect(screen.getByText(/No stakeholder roles are available/)).toBeInTheDocument();
      expect(screen.getByText('Clear Cache & Reload')).toBeInTheDocument();
    });

    it('handles cache clearing', () => {
      const emptySurvey = { ...mockSurvey, stakeholders: [] };
      const mockReload = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: mockReload },
        writable: true,
      });
      
      render(
        <StakeholderSelection
          survey={emptySurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      const clearButton = screen.getByText('Clear Cache & Reload');
      fireEvent.click(clearButton);

      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe('Stakeholder Selection', () => {
    it('allows selecting a stakeholder', () => {
      render(
        <StakeholderSelection
          survey={mockSurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      const stakeholderCard = screen.getByText('CEO');
      fireEvent.click(stakeholderCard);

      expect(mockStakeholderSelectionManager.setStakeholder).toHaveBeenCalledWith('ceo');
    });

    it('shows selected stakeholder visually', () => {
      render(
        <StakeholderSelection
          survey={mockSurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      const stakeholderCard = screen.getByText('CEO').closest('div');
      fireEvent.click(stakeholderCard!);

      // Check for visual indicators of selection
      expect(stakeholderCard).toHaveClass('border-blue-500', 'bg-blue-50');
    });

    it('shows continue button when stakeholder is selected', async () => {
      render(
        <StakeholderSelection
          survey={mockSurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      const stakeholderCard = screen.getByText('CEO');
      fireEvent.click(stakeholderCard);

      await waitFor(() => {
        expect(screen.getByText('Continue to Survey')).toBeInTheDocument();
      });
    });

    it('resets expertise when changing stakeholder', () => {
      render(
        <StakeholderSelection
          survey={mockSurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      // Select first stakeholder
      const ceoCard = screen.getByText('CEO');
      fireEvent.click(ceoCard);

      // Select second stakeholder
      const ctoCard = screen.getByText('CTO');
      fireEvent.click(ctoCard);

      expect(mockStakeholderSelectionManager.setStakeholder).toHaveBeenCalledWith('cto');
    });
  });

  describe('Expertise Selection', () => {
    beforeEach(() => {
      // Pre-select a stakeholder for expertise tests
      mockStakeholderSelectionManager.getState.mockReturnValue({
        selectedStakeholderId: 'ceo',
        selectedExpertise: [],
      });
    });

    it('shows expertise options after selecting stakeholder', () => {
      render(
        <StakeholderSelection
          survey={mockSurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      const stakeholderCard = screen.getByText('CEO');
      fireEvent.click(stakeholderCard);

      expect(screen.getByText('leadership')).toBeInTheDocument();
      expect(screen.getByText('technology')).toBeInTheDocument();
      expect(screen.getByText('strategy')).toBeInTheDocument();
      expect(screen.getByText('development')).toBeInTheDocument();
    });

    it('allows selecting expertise areas', () => {
      render(
        <StakeholderSelection
          survey={mockSurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      const stakeholderCard = screen.getByText('CEO');
      fireEvent.click(stakeholderCard);

      const expertiseCheckbox = screen.getByLabelText('leadership');
      fireEvent.click(expertiseCheckbox);

      expect(mockStakeholderSelectionManager.setExpertise).toHaveBeenCalledWith(['leadership']);
    });

    it('allows deselecting expertise areas', () => {
      render(
        <StakeholderSelection
          survey={mockSurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      const stakeholderCard = screen.getByText('CEO');
      fireEvent.click(stakeholderCard);

      const expertiseCheckbox = screen.getByLabelText('leadership');
      
      // Select first
      fireEvent.click(expertiseCheckbox);
      
      // Deselect
      fireEvent.click(expertiseCheckbox);

      expect(mockStakeholderSelectionManager.setExpertise).toHaveBeenLastCalledWith([]);
    });

    it('shows message when no expertise is selected', () => {
      render(
        <StakeholderSelection
          survey={mockSurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      const stakeholderCard = screen.getByText('CEO');
      fireEvent.click(stakeholderCard);

      expect(screen.getByText(/No expertise areas selected/)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows validation errors when continuing without valid selection', async () => {
      mockValidateStakeholderSelection.mockReturnValue({
        isValid: false,
        errors: ['Please select a stakeholder role'],
      });

      render(
        <StakeholderSelection
          survey={mockSurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      const stakeholderCard = screen.getByText('CEO');
      fireEvent.click(stakeholderCard);

      const continueButton = screen.getByText('Continue to Survey');
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText('Please select a stakeholder role')).toBeInTheDocument();
      });
    });

    it('calls onSelect when validation passes', async () => {
      mockValidateStakeholderSelection.mockReturnValue({
        isValid: true,
        errors: [],
      });

      render(
        <StakeholderSelection
          survey={mockSurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      const stakeholderCard = screen.getByText('CEO');
      fireEvent.click(stakeholderCard);

      const continueButton = screen.getByText('Continue to Survey');
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledWith('ceo', []);
      });
    });

    it('shows loading state during validation', async () => {
      mockValidateStakeholderSelection.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve({ isValid: true, errors: [] }), 100);
        });
      });

      render(
        <StakeholderSelection
          survey={mockSurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      const stakeholderCard = screen.getByText('CEO');
      fireEvent.click(stakeholderCard);

      const continueButton = screen.getByText('Continue to Survey');
      fireEvent.click(continueButton);

      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(continueButton).toBeDisabled();
    });
  });

  describe('State Persistence', () => {
    it('restores saved state on mount', () => {
      mockStakeholderSelectionManager.getState.mockReturnValue({
        selectedStakeholderId: 'ceo',
        selectedExpertise: ['leadership', 'strategy'],
      });

      render(
        <StakeholderSelection
          survey={mockSurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      // Should restore the selected stakeholder
      const ceoCard = screen.getByText('CEO').closest('div');
      expect(ceoCard).toHaveClass('border-blue-500', 'bg-blue-50');
    });

    it('saves state changes', () => {
      render(
        <StakeholderSelection
          survey={mockSurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      const stakeholderCard = screen.getByText('CEO');
      fireEvent.click(stakeholderCard);

      expect(mockStakeholderSelectionManager.setStakeholder).toHaveBeenCalledWith('ceo');
    });
  });

  describe('Navigation', () => {
    it('calls onBack when back button is clicked', () => {
      render(
        <StakeholderSelection
          survey={mockSurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      const backButton = screen.getByText('Back to Survey Selection');
      fireEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  describe('Preview Section', () => {
    it('shows preview when stakeholder is selected', () => {
      render(
        <StakeholderSelection
          survey={mockSurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      const stakeholderCard = screen.getByText('CEO');
      fireEvent.click(stakeholderCard);

      expect(screen.getByText('Survey Preview')).toBeInTheDocument();
      expect(screen.getByText('Your Role')).toBeInTheDocument();
      expect(screen.getByText('Expertise Areas')).toBeInTheDocument();
      expect(screen.getByText('Estimated Time')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(
        <StakeholderSelection
          survey={mockSurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      const stakeholderCard = screen.getByText('CEO');
      fireEvent.click(stakeholderCard);

      // Check for proper labeling
      const expertiseCheckbox = screen.getByLabelText('leadership');
      expect(expertiseCheckbox).toHaveAttribute('id', 'leadership');
    });

    it('supports keyboard navigation', () => {
      render(
        <StakeholderSelection
          survey={mockSurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      const stakeholderCard = screen.getByText('CEO').closest('div');
      
      // Should be focusable
      stakeholderCard?.focus();
      
      // Should handle Enter key
      fireEvent.keyDown(stakeholderCard!, { key: 'Enter', code: 'Enter' });
    });
  });

  describe('Performance', () => {
    it('renders quickly', async () => {
      const renderTime = await testUtils.createPerformanceTestHelpers().measureRenderTime(
        () => render(
          <StakeholderSelection
            survey={mockSurvey}
            onSelect={mockOnSelect}
            onBack={mockOnBack}
          />
        )
      );

      expect(renderTime).toBeLessThan(200);
    });
  });

  describe('Error Scenarios', () => {
    it('handles validation errors gracefully', async () => {
      mockValidateStakeholderSelection.mockImplementation(() => {
        throw new Error('Validation failed');
      });

      render(
        <StakeholderSelection
          survey={mockSurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      const stakeholderCard = screen.getByText('CEO');
      fireEvent.click(stakeholderCard);

      const continueButton = screen.getByText('Continue to Survey');
      fireEvent.click(continueButton);

      await waitFor(() => {
        expect(screen.getByText(/An error occurred while processing/)).toBeInTheDocument();
      });
    });

    it('handles missing stakeholder data', () => {
      const invalidSurvey = { ...mockSurvey, stakeholders: undefined as any };
      
      render(
        <StakeholderSelection
          survey={invalidSurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Survey Data Issue')).toBeInTheDocument();
    });
  });

  describe('Debug Features', () => {
    it('shows debug panel in development mode', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <StakeholderSelection
          survey={mockSurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText('Debug Information')).toBeInTheDocument();
      expect(screen.getByText('Log Survey Data')).toBeInTheDocument();
      expect(screen.getByText('Clear Cache')).toBeInTheDocument();
      expect(screen.getByText('Reset Selection')).toBeInTheDocument();

      process.env.NODE_ENV = originalNodeEnv;
    });

    it('handles debug actions', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <StakeholderSelection
          survey={mockSurvey}
          onSelect={mockOnSelect}
          onBack={mockOnBack}
        />
      );

      const resetButton = screen.getByText('Reset Selection');
      fireEvent.click(resetButton);

      expect(mockStakeholderSelectionManager.reset).toHaveBeenCalled();

      process.env.NODE_ENV = originalNodeEnv;
    });
  });
});