import { put, list, del } from '@vercel/blob';
import { promises as fs } from 'fs';
import path from 'path';
import { SurveySchema, SurveyResponse, SurveyResult } from './types';

export class SurveyDataManager {
  private static instance: SurveyDataManager;
  private isProduction = process.env.NODE_ENV === 'production';
  private dataDir = path.join(process.cwd(), 'data');
  private publicDir = path.join(process.cwd(), 'public');
  private privateSurveysDir = path.join(process.cwd(), 'private-surveys');
  private enablePrivateSurveys = process.env.ENABLE_PRIVATE_SURVEYS === 'true';
  
  static getInstance(): SurveyDataManager {
    if (!SurveyDataManager.instance) {
      SurveyDataManager.instance = new SurveyDataManager();
    }
    return SurveyDataManager.instance;
  }

  constructor() {
    // Ensure data directory exists in development
    if (!this.isProduction) {
      this.ensureDataDirectories();
    }
  }

  private async ensureDataDirectories() {
    const dirs = [
      path.join(this.dataDir, 'schemas'),
      path.join(this.dataDir, 'responses'),
      path.join(this.dataDir, 'results')
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        console.error(`Failed to create directory ${dir}:`, error);
      }
    }
  }

  // Schema Management - Now reads from public directory
  async saveSchema(schema: SurveySchema): Promise<string> {
    // Schemas are now static files in public directory
    // This method is kept for compatibility but schemas should be managed manually
    const filename = `surveys/${schema.id}.json`;
    const data = JSON.stringify(schema, null, 2);
    
    const filePath = path.join(this.publicDir, filename);
    await fs.writeFile(filePath, data, 'utf8');
    return `file://${filePath}`;
  }

  async getSchema(schemaId: string): Promise<SurveySchema | null> {
    try {
      // First try public surveys
      const publicPath = path.join(this.publicDir, 'surveys', `${schemaId}.json`);
      try {
        const data = await fs.readFile(publicPath, 'utf8');
        return JSON.parse(data) as SurveySchema;
      } catch {
        // If not found in public, try private surveys (if enabled)
        if (this.enablePrivateSurveys) {
          return await this.getPrivateSchema(schemaId);
        }
        throw new Error('Survey not found');
      }
    } catch (error) {
      console.error('Error fetching schema:', error);
      return null;
    }
  }

  private async getPrivateSchema(schemaId: string): Promise<SurveySchema | null> {
    try {
      // Check if private surveys directory exists
      await fs.access(this.privateSurveysDir);
      
      // Search in all private survey directories
      const privateDirs = await fs.readdir(this.privateSurveysDir);
      
      for (const dir of privateDirs) {
        const dirPath = path.join(this.privateSurveysDir, dir);
        const stat = await fs.stat(dirPath);
        
        if (stat.isDirectory()) {
          // Check for survey file directly in directory
          const surveyPath = path.join(dirPath, `${schemaId}.json`);
          try {
            const data = await fs.readFile(surveyPath, 'utf8');
            return JSON.parse(data) as SurveySchema;
          } catch {
            // Check in data subdirectory
            const dataPath = path.join(dirPath, 'data', `${schemaId}.json`);
            try {
              const data = await fs.readFile(dataPath, 'utf8');
              return JSON.parse(data) as SurveySchema;
            } catch {
              continue;
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      console.log(`Private surveys directory not found: ${this.privateSurveysDir}`);
      return null;
    }
  }

  async listSchemas(): Promise<SurveySchema[]> {
    try {
      // Use filesystem approach for both development and production
      // In production (Vercel), the public files are still accessible via filesystem
      const schemasDir = path.join(this.publicDir, 'surveys');
      try {
        const files = await fs.readdir(schemasDir);
        const jsonFiles = files.filter(file => file.endsWith('.json') && file !== 'index.json');

        const schemas: SurveySchema[] = [];
        
        for (const file of jsonFiles) {
          try {
            const filePath = path.join(schemasDir, file);
            const data = await fs.readFile(filePath, 'utf8');
            const schema = JSON.parse(data) as SurveySchema;
            schemas.push(schema);
          } catch (error) {
            console.error(`Error parsing survey file ${file}:`, error);
            // Continue processing other files
          }
        }

        const activeSchemas = schemas.filter(schema => schema.isActive);
        return activeSchemas;
      } catch (error) {
        console.error('Error reading surveys directory:', error);
        return [];
      }
    } catch (error) {
      console.error('Error listing schemas:', error);
      return [];
    }
  }

  async getSurveyIndex(): Promise<any> {
    try {
      // Use filesystem approach for both development and production
      // In production (Vercel), the public files are still accessible via filesystem
      const indexPath = path.join(this.publicDir, 'surveys', 'index.json');
      const data = await fs.readFile(indexPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error fetching survey index:', error);
      return { surveys: [], categories: [], lastUpdated: new Date().toISOString() };
    }
  }

  // Response Management
  async saveResponse(
    schemaId: string, 
    organizationId: string, 
    response: SurveyResponse
  ): Promise<string> {
    const filename = `responses/${schemaId}/${organizationId}/${response.respondentId}.json`;
    const data = JSON.stringify(response, null, 2);

    if (this.isProduction) {
      const blob = await put(filename, data, {
        access: 'public',
        contentType: 'application/json',
      });
      return blob.url;
    } else {
      const filePath = path.join(this.dataDir, filename);
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, data, 'utf8');
      return `file://${filePath}`;
    }
  }

  async getOrganizationResponses(
    schemaId: string, 
    organizationId: string
  ): Promise<SurveyResponse[]> {
    try {
      if (this.isProduction) {
        const { blobs } = await list({
          prefix: `responses/${schemaId}/${organizationId}/`,
        });

        const responses = await Promise.all(
          blobs.map(async (blob) => {
            const response = await fetch(blob.url);
            return await response.json() as SurveyResponse;
          })
        );

        return responses;
      } else {
        // Try public data first
        let responseDir = path.join(this.dataDir, 'responses', schemaId, organizationId);
        let responses = await this.loadResponsesFromDirectory(responseDir);
        
        // If no responses found and private surveys enabled, try private locations
        if (responses.length === 0 && this.enablePrivateSurveys) {
          const privateResponsesDir = await this.findPrivateDataPath(schemaId, 'responses', organizationId);
          if (privateResponsesDir) {
            responses = await this.loadResponsesFromDirectory(privateResponsesDir);
          }
        }
        
        return responses;
      }
    } catch (error) {
      console.error('Error fetching organization responses:', error);
      return [];
    }
  }

  private async loadResponsesFromDirectory(responseDir: string): Promise<SurveyResponse[]> {
    try {
      const files = await fs.readdir(responseDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      const responses = await Promise.all(
        jsonFiles.map(async (file) => {
          const filePath = path.join(responseDir, file);
          const data = await fs.readFile(filePath, 'utf8');
          return JSON.parse(data) as SurveyResponse;
        })
      );

      return responses;
    } catch (error) {
      // Directory doesn't exist
      return [];
    }
  }

  private async findPrivateDataPath(schemaId: string, type: 'responses' | 'results', organizationId?: string): Promise<string | null> {
    try {
      // Check if private surveys directory exists
      await fs.access(this.privateSurveysDir);
      
      const privateDirs = await fs.readdir(this.privateSurveysDir);
      
      for (const dir of privateDirs) {
        const dataPath = path.join(this.privateSurveysDir, dir, 'data', type, schemaId);
        if (organizationId) {
          const orgPath = path.join(dataPath, organizationId);
          try {
            await fs.access(orgPath);
            return orgPath;
          } catch {
            continue;
          }
        } else {
          try {
            await fs.access(dataPath);
            return dataPath;
          } catch {
            continue;
          }
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  async getAllResponses(schemaId: string): Promise<SurveyResponse[]> {
    try {
      if (this.isProduction) {
        const { blobs } = await list({
          prefix: `responses/${schemaId}/`,
        });

        const responses = await Promise.all(
          blobs.map(async (blob) => {
            const response = await fetch(blob.url);
            return await response.json() as SurveyResponse;
          })
        );

        return responses;
      } else {
        const responsesDir = path.join(this.dataDir, 'responses', schemaId);
        
        try {
          const organizations = await fs.readdir(responsesDir);
          const allResponses: SurveyResponse[] = [];

          for (const org of organizations) {
            const orgDir = path.join(responsesDir, org);
            const stat = await fs.stat(orgDir);
            
            if (stat.isDirectory()) {
              const files = await fs.readdir(orgDir);
              const jsonFiles = files.filter(file => file.endsWith('.json'));

              for (const file of jsonFiles) {
                const filePath = path.join(orgDir, file);
                const data = await fs.readFile(filePath, 'utf8');
                allResponses.push(JSON.parse(data) as SurveyResponse);
              }
            }
          }

          return allResponses;
        } catch (error) {
          // Directory doesn't exist yet
          return [];
        }
      }
    } catch (error) {
      console.error('Error fetching all responses:', error);
      return [];
    }
  }

  // Results Management
  async saveResult(
    schemaId: string, 
    organizationId: string, 
    result: SurveyResult
  ): Promise<string> {
    const filename = `results/${schemaId}/${organizationId}/result.json`;
    const data = JSON.stringify(result, null, 2);

    if (this.isProduction) {
      const blob = await put(filename, data, {
        access: 'public',
        contentType: 'application/json',
      });
      return blob.url;
    } else {
      const filePath = path.join(this.dataDir, filename);
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, data, 'utf8');
      return `file://${filePath}`;
    }
  }

  async getResult(
    schemaId: string, 
    organizationId: string
  ): Promise<SurveyResult | null> {
    try {
      if (this.isProduction) {
        const { blobs } = await list({
          prefix: `results/${schemaId}/${organizationId}/result.json`,
        });

        if (blobs.length === 0) return null;

        const response = await fetch(blobs[0].url);
        return await response.json() as SurveyResult;
      } else {
        // Try public data first
        let filePath = path.join(this.dataDir, 'results', schemaId, organizationId, 'result.json');
        try {
          const data = await fs.readFile(filePath, 'utf8');
          return JSON.parse(data) as SurveyResult;
        } catch {
          // If not found and private surveys enabled, try private locations
          if (this.enablePrivateSurveys) {
            const privateResultsDir = await this.findPrivateDataPath(schemaId, 'results', organizationId);
            if (privateResultsDir) {
              const privateFilePath = path.join(privateResultsDir, 'result.json');
              try {
                const data = await fs.readFile(privateFilePath, 'utf8');
                return JSON.parse(data) as SurveyResult;
              } catch {
                return null;
              }
            }
          }
          return null;
        }
      }
    } catch (error) {
      console.error('Error fetching result:', error);
      return null;
    }
  }

  async getAllResults(schemaId: string): Promise<SurveyResult[]> {
    try {
      if (this.isProduction) {
        const { blobs } = await list({
          prefix: `results/${schemaId}/`,
        });

        const results = await Promise.all(
          blobs.map(async (blob) => {
            const response = await fetch(blob.url);
            return await response.json() as SurveyResult;
          })
        );

        return results;
      } else {
        const resultsDir = path.join(this.dataDir, 'results', schemaId);
        
        try {
          const organizations = await fs.readdir(resultsDir);
          const allResults: SurveyResult[] = [];

          for (const org of organizations) {
            const orgDir = path.join(resultsDir, org);
            const stat = await fs.stat(orgDir);
            
            if (stat.isDirectory()) {
              const resultFile = path.join(orgDir, 'result.json');
              try {
                const data = await fs.readFile(resultFile, 'utf8');
                allResults.push(JSON.parse(data) as SurveyResult);
              } catch (error) {
                // Result file doesn't exist for this organization
                continue;
              }
            }
          }

          return allResults;
        } catch (error) {
          // Directory doesn't exist yet
          return [];
        }
      }
    } catch (error) {
      console.error('Error fetching all results:', error);
      return [];
    }
  }

  // Utility methods
  async deleteSchema(schemaId: string): Promise<void> {
    // Schemas are now static files in public directory
    // This method is kept for compatibility but schemas should be managed manually
    const filePath = path.join(this.publicDir, 'surveys', `${schemaId}.json`);
    await fs.unlink(filePath);
  }

  async deleteResponse(schemaId: string, organizationId: string, respondentId: string): Promise<void> {
    if (this.isProduction) {
      await del(`responses/${schemaId}/${organizationId}/${respondentId}.json`);
    } else {
      const filePath = path.join(this.dataDir, 'responses', schemaId, organizationId, `${respondentId}.json`);
      await fs.unlink(filePath);
    }
  }

  async deleteResult(schemaId: string, organizationId: string): Promise<void> {
    if (this.isProduction) {
      await del(`results/${schemaId}/${organizationId}/result.json`);
    } else {
      const filePath = path.join(this.dataDir, 'results', schemaId, organizationId, 'result.json');
      await fs.unlink(filePath);
    }
  }

  // Development-only utilities
  async clearAllData(): Promise<void> {
    if (this.isProduction) {
      throw new Error('Cannot clear data in production environment');
    }

    try {
      await fs.rm(this.dataDir, { recursive: true, force: true });
      await this.ensureDataDirectories();
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }

  async exportDevData(): Promise<any> {
    if (this.isProduction) {
      throw new Error('Export not available in production');
    }

    try {
      const schemas = await this.listSchemas();
      const exportData: any = { schemas: {}, responses: {}, results: {} };

      for (const schema of schemas) {
        exportData.schemas[schema.id] = schema;
        exportData.responses[schema.id] = await this.getAllResponses(schema.id);
        exportData.results[schema.id] = await this.getAllResults(schema.id);
      }

      return exportData;
    } catch (error) {
      console.error('Error exporting dev data:', error);
      return null;
    }
  }

  async importDevData(data: any): Promise<void> {
    if (this.isProduction) {
      throw new Error('Import not available in production');
    }

    try {
      // Clear existing data
      await this.clearAllData();

      // Import schemas
      for (const [schemaId, schema] of Object.entries(data.schemas)) {
        await this.saveSchema(schema as SurveySchema);
      }

      // Import responses
      for (const [schemaId, responses] of Object.entries(data.responses)) {
        for (const response of responses as SurveyResponse[]) {
          await this.saveResponse(schemaId, response.organizationId, response);
        }
      }

      // Import results
      for (const [schemaId, results] of Object.entries(data.results)) {
        for (const result of results as SurveyResult[]) {
          await this.saveResult(schemaId, result.organizationId, result);
        }
      }
    } catch (error) {
      console.error('Error importing dev data:', error);
      throw error;
    }
  }
}