// Debug utilities for troubleshooting browser cache and state issues

export class DebugUtils {
  private static readonly DEBUG_PREFIX = '[DebugUtils]';

  // Force clear all browser storage
  static forceClearBrowserData(): void {
    try {
      // Clear localStorage
      localStorage.clear();
      console.log(`${this.DEBUG_PREFIX} Cleared localStorage`);

      // Clear sessionStorage
      sessionStorage.clear();
      console.log(`${this.DEBUG_PREFIX} Cleared sessionStorage`);

      // Clear IndexedDB (if any)
      if ('indexedDB' in window) {
        indexedDB.databases().then(databases => {
          databases.forEach(db => {
            if (db.name) {
              const deleteReq = indexedDB.deleteDatabase(db.name);
              deleteReq.onsuccess = () => console.log(`${this.DEBUG_PREFIX} Deleted IndexedDB: ${db.name}`);
            }
          });
        }).catch(console.warn);
      }

      // Clear service worker cache (if any)
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
            console.log(`${this.DEBUG_PREFIX} Deleted cache: ${name}`);
          });
        }).catch(console.warn);
      }

      console.log(`${this.DEBUG_PREFIX} Force clear completed`);
    } catch (error) {
      console.error(`${this.DEBUG_PREFIX} Error during force clear:`, error);
    }
  }

  // Add cache-busting parameter to survey data loading
  static getCacheBustedUrl(url: string): string {
    const separator = url.includes('?') ? '&' : '?';
    const timestamp = Date.now();
    return `${url}${separator}_t=${timestamp}`;
  }

  // Log comprehensive debug information
  static logDebugInfo(context: string, data?: any): void {
    console.group(`${this.DEBUG_PREFIX} ${context}`);
    console.log('Timestamp:', new Date().toISOString());
    console.log('User Agent:', navigator.userAgent);
    console.log('Location:', window.location.href);
    
    if (data) {
      console.log('Context Data:', data);
    }

    // Log localStorage contents
    console.log('LocalStorage Survey Keys:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('survey')) {
        console.log(`  ${key}:`, localStorage.getItem(key));
      }
    }

    console.groupEnd();
  }

  // Validate survey data structure
  static validateSurveyData(survey: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!survey) {
      errors.push('Survey is null or undefined');
      return { isValid: false, errors };
    }

    if (!survey.id) {
      errors.push('Survey missing ID');
    }

    if (!survey.name) {
      errors.push('Survey missing name');
    }

    if (!survey.stakeholders) {
      errors.push('Survey missing stakeholders array');
    } else if (!Array.isArray(survey.stakeholders)) {
      errors.push('Survey stakeholders is not an array');
    } else if (survey.stakeholders.length === 0) {
      errors.push('Survey stakeholders array is empty');
    } else {
      // Validate stakeholder structure
      survey.stakeholders.forEach((stakeholder: any, index: number) => {
        if (!stakeholder.id) {
          errors.push(`Stakeholder ${index} missing ID`);
        }
        if (!stakeholder.name) {
          errors.push(`Stakeholder ${index} missing name`);
        }
      });
    }

    if (!survey.questions || !Array.isArray(survey.questions) || survey.questions.length === 0) {
      errors.push('Survey missing or empty questions array');
    }

    const isValid = errors.length === 0;
    
    console.log(`${this.DEBUG_PREFIX} Survey validation:`, { isValid, errors, survey });
    
    return { isValid, errors };
  }

  // Create a debug info object for reporting issues
  static createDebugReport(): any {
    return {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      location: window.location.href,
      localStorage: this.getLocalStorageContents(),
      sessionStorage: this.getSessionStorageContents(),
      browserInfo: {
        cookieEnabled: navigator.cookieEnabled,
        language: navigator.language,
        onLine: navigator.onLine,
        platform: navigator.platform
      }
    };
  }

  private static getLocalStorageContents(): any {
    const contents: any = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          contents[key] = localStorage.getItem(key);
        }
      }
    } catch (error) {
      contents._error = error?.toString();
    }
    return contents;
  }

  private static getSessionStorageContents(): any {
    const contents: any = {};
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          contents[key] = sessionStorage.getItem(key);
        }
      }
    } catch (error) {
      contents._error = error?.toString();
    }
    return contents;
  }
}

// Global debug function for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).surveyorDebug = {
    clearCache: () => DebugUtils.forceClearBrowserData(),
    logDebug: (context: string, data?: any) => DebugUtils.logDebugInfo(context, data),
    createReport: () => DebugUtils.createDebugReport(),
    validateSurvey: (survey: any) => DebugUtils.validateSurveyData(survey)
  };
}