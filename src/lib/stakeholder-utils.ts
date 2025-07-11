import { StakeholderDefinition } from './types';

export interface StakeholderSelectionState {
  selectedStakeholderId: string | null;
  selectedExpertise: string[];
  validationErrors: string[];
  isValid: boolean;
}

export interface StakeholderValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class StakeholderSelectionManager {
  private state: StakeholderSelectionState = {
    selectedStakeholderId: null,
    selectedExpertise: [],
    validationErrors: [],
    isValid: false
  };

  constructor() {
    // Initialize from localStorage if available
    this.loadFromStorage();
  }

  // Set selected stakeholder
  setStakeholder(stakeholderId: string): void {
    this.state.selectedStakeholderId = stakeholderId;
    this.state.selectedExpertise = []; // Reset expertise when changing stakeholder
    this.validateState();
    this.saveToStorage();
  }

  // Set selected expertise
  setExpertise(expertise: string[]): void {
    this.state.selectedExpertise = expertise;
    this.validateState();
    this.saveToStorage();
  }

  // Toggle expertise selection
  toggleExpertise(expertise: string): void {
    const index = this.state.selectedExpertise.indexOf(expertise);
    if (index > -1) {
      this.state.selectedExpertise.splice(index, 1);
    } else {
      this.state.selectedExpertise.push(expertise);
    }
    this.validateState();
    this.saveToStorage();
  }

  // Validate current state
  validateState(): StakeholderValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.state.selectedStakeholderId) {
      errors.push('Stakeholder role is required');
    }

    if (this.state.selectedExpertise.length === 0) {
      warnings.push('No expertise areas selected - you will receive general questions');
    }

    this.state.validationErrors = errors;
    this.state.isValid = errors.length === 0;

    return {
      isValid: this.state.isValid,
      errors,
      warnings
    };
  }

  // Get current state
  getState(): StakeholderSelectionState {
    return { ...this.state };
  }

  // Reset state
  reset(): void {
    this.state = {
      selectedStakeholderId: null,
      selectedExpertise: [],
      validationErrors: [],
      isValid: false
    };
    this.clearStorage();
  }

  // Check if stakeholder is valid
  isStakeholderValid(stakeholders: StakeholderDefinition[]): boolean {
    if (!this.state.selectedStakeholderId) return false;
    return stakeholders.some(s => s.id === this.state.selectedStakeholderId);
  }

  // Get stakeholder data
  getStakeholderData(stakeholders: StakeholderDefinition[]): StakeholderDefinition | null {
    if (!this.state.selectedStakeholderId) return null;
    return stakeholders.find(s => s.id === this.state.selectedStakeholderId) || null;
  }

  // Save state to localStorage
  private saveToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('stakeholder-selection', JSON.stringify(this.state));
      } catch (error) {
        console.warn('Failed to save stakeholder selection to localStorage:', error);
      }
    }
  }

  // Load state from localStorage
  private loadFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('stakeholder-selection');
        if (stored) {
          const parsedState = JSON.parse(stored);
          this.state = { ...this.state, ...parsedState };
          this.validateState();
        }
      } catch (error) {
        console.warn('Failed to load stakeholder selection from localStorage:', error);
      }
    }
  }

  // Clear localStorage
  private clearStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('stakeholder-selection');
      } catch (error) {
        console.warn('Failed to clear stakeholder selection from localStorage:', error);
      }
    }
  }
}

// Utility functions
export function validateStakeholderSelection(
  stakeholderId: string | null,
  expertise: string[],
  availableStakeholders: StakeholderDefinition[]
): StakeholderValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!stakeholderId) {
    errors.push('Please select a stakeholder role');
  } else if (!availableStakeholders.some(s => s.id === stakeholderId)) {
    errors.push('Selected stakeholder role is not valid');
  }

  if (expertise.length === 0) {
    warnings.push('No expertise areas selected - you will receive general questions for your role');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function getStakeholderRecommendations(
  userExpertise: string[],
  availableStakeholders: StakeholderDefinition[]
): { stakeholderId: string; confidence: number; reason: string }[] {
  if (userExpertise.length === 0) {
    return availableStakeholders.map(stakeholder => ({
      stakeholderId: stakeholder.id,
      confidence: 0.5,
      reason: 'No expertise provided - general recommendation'
    }));
  }

  return availableStakeholders.map(stakeholder => {
    const requiredExpertise = stakeholder.requiredExpertise || [];
    const matchingExpertise = userExpertise.filter(exp => requiredExpertise.includes(exp));
    const confidence = matchingExpertise.length / Math.max(requiredExpertise.length, 1);
    
    let reason = 'General role match';
    if (matchingExpertise.length > 0) {
      reason = `Strong match: ${matchingExpertise.join(', ')}`;
    } else if (requiredExpertise.length === 0) {
      reason = 'Open role - suitable for all backgrounds';
    }

    return {
      stakeholderId: stakeholder.id,
      confidence: Math.min(confidence, 1),
      reason
    };
  }).sort((a, b) => b.confidence - a.confidence);
}

export function getExpertiseOptions(): string[] {
  return [
    'strategy',
    'governance',
    'infrastructure',
    'data',
    'operations',
    'leadership',
    'development',
    'design',
    'security',
    'compliance'
  ];
}

export function formatExpertise(expertise: string[]): string {
  if (expertise.length === 0) return 'No specific expertise';
  if (expertise.length === 1) return expertise[0];
  if (expertise.length === 2) return expertise.join(' and ');
  return expertise.slice(0, -1).join(', ') + ', and ' + expertise[expertise.length - 1];
}

// Create a singleton instance
export const stakeholderSelectionManager = new StakeholderSelectionManager();