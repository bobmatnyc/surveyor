import { put, list, del, head } from '@vercel/blob';
import { SurveySchema, SurveyResponse, SurveyResult } from './types';
import { SurveyCodes } from './security';
import crypto from 'crypto';

export interface SurveyMetadata {
  surveyId: string;
  distributionCode: string;
  adminCode: string;
  uploadedBy: string;
  uploadedAt: string;
  title: string;
  description?: string;
  distributionUrl: string;
  adminUrl: string;
  isActive: boolean;
}

export interface StoredSurveyData {
  survey: SurveySchema;
  metadata: SurveyMetadata;
  responses: SurveyResponse[];
  results?: SurveyResult[];
}

export class BlobSurveyStorage {
  private static readonly BLOB_PREFIX = 'surveys/';
  private static readonly METADATA_PREFIX = 'metadata/';
  private static readonly RESPONSES_PREFIX = 'responses/';
  private static readonly RESULTS_PREFIX = 'results/';

  /**
   * Generate unique survey ID
   */
  private static generateSurveyId(): string {
    return `survey_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Store survey with generated codes in blob storage
   */
  public static async storeSurvey(
    survey: SurveySchema,
    uploadedBy: string,
    baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  ): Promise<SurveyMetadata> {
    try {
      // Generate unique survey ID and codes
      const surveyId = this.generateSurveyId();
      const { distributionCode, adminCode } = SurveyCodes.generateCodePair();
      
      // Create metadata
      const metadata: SurveyMetadata = {
        surveyId,
        distributionCode,
        adminCode,
        uploadedBy,
        uploadedAt: new Date().toISOString(),
        title: survey.name,
        description: survey.description,
        distributionUrl: `${baseUrl}/survey/${distributionCode}`,
        adminUrl: `${baseUrl}/admin/results/${adminCode}`,
        isActive: true
      };

      // Update survey with new ID
      const updatedSurvey: SurveySchema = {
        ...survey,
        id: surveyId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store survey data
      const surveyBlob = await put(
        `${this.BLOB_PREFIX}${surveyId}.json`,
        JSON.stringify(updatedSurvey, null, 2),
        {
          access: 'public',
          addRandomSuffix: false
        }
      );

      // Store metadata
      const metadataBlob = await put(
        `${this.METADATA_PREFIX}${surveyId}.json`,
        JSON.stringify(metadata, null, 2),
        {
          access: 'public',
          addRandomSuffix: false
        }
      );

      // Create distribution code mapping
      await put(
        `${this.BLOB_PREFIX}dist_${distributionCode}.json`,
        JSON.stringify({ surveyId, type: 'distribution' }),
        {
          access: 'public',
          addRandomSuffix: false
        }
      );

      // Create admin code mapping
      await put(
        `${this.BLOB_PREFIX}admin_${adminCode}.json`,
        JSON.stringify({ surveyId, type: 'admin' }),
        {
          access: 'public',
          addRandomSuffix: false
        }
      );

      // Initialize empty responses array
      await put(
        `${this.RESPONSES_PREFIX}${surveyId}.json`,
        JSON.stringify([], null, 2),
        {
          access: 'public',
          addRandomSuffix: false
        }
      );

      console.log('Survey stored successfully:', {
        surveyId,
        distributionCode,
        adminCode,
        surveyBlob: surveyBlob.url,
        metadataBlob: metadataBlob.url
      });

      return metadata;
    } catch (error) {
      console.error('Error storing survey:', error);
      throw new Error('Failed to store survey in blob storage');
    }
  }

  /**
   * Get survey by distribution code (public access)
   */
  public static async getSurveyByDistributionCode(distributionCode: string): Promise<SurveySchema | null> {
    try {
      // Validate code format
      if (!SurveyCodes.validateCodeFormat(distributionCode)) {
        return null;
      }

      // Get survey ID from distribution code mapping
      const mappingResponse = await fetch(`https://blob.vercel-storage.com/${this.BLOB_PREFIX}dist_${distributionCode}.json`);
      if (!mappingResponse.ok) {
        return null;
      }

      const mapping = await mappingResponse.json();
      if (mapping.type !== 'distribution') {
        return null;
      }

      // Get survey data
      const surveyResponse = await fetch(`https://blob.vercel-storage.com/${this.BLOB_PREFIX}${mapping.surveyId}.json`);
      if (!surveyResponse.ok) {
        return null;
      }

      const survey = await surveyResponse.json();
      
      // Verify survey is active
      const metadataResponse = await fetch(`https://blob.vercel-storage.com/${this.METADATA_PREFIX}${mapping.surveyId}.json`);
      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json();
        if (!metadata.isActive) {
          return null;
        }
      }

      return survey;
    } catch (error) {
      console.error('Error retrieving survey by distribution code:', error);
      return null;
    }
  }

  /**
   * Get survey results by admin code (private access)
   */
  public static async getResultsByAdminCode(adminCode: string): Promise<{ 
    survey: SurveySchema; 
    metadata: SurveyMetadata; 
    responses: SurveyResponse[]; 
    results?: SurveyResult[] 
  } | null> {
    try {
      // Validate code format
      if (!SurveyCodes.validateCodeFormat(adminCode)) {
        return null;
      }

      // Get survey ID from admin code mapping
      const mappingResponse = await fetch(`https://blob.vercel-storage.com/${this.BLOB_PREFIX}admin_${adminCode}.json`);
      if (!mappingResponse.ok) {
        return null;
      }

      const mapping = await mappingResponse.json();
      if (mapping.type !== 'admin') {
        return null;
      }

      const surveyId = mapping.surveyId;

      // Get survey data
      const surveyResponse = await fetch(`https://blob.vercel-storage.com/${this.BLOB_PREFIX}${surveyId}.json`);
      if (!surveyResponse.ok) {
        return null;
      }
      const survey = await surveyResponse.json();

      // Get metadata
      const metadataResponse = await fetch(`https://blob.vercel-storage.com/${this.METADATA_PREFIX}${surveyId}.json`);
      if (!metadataResponse.ok) {
        return null;
      }
      const metadata = await metadataResponse.json();

      // Get responses
      const responsesResponse = await fetch(`https://blob.vercel-storage.com/${this.RESPONSES_PREFIX}${surveyId}.json`);
      const responses = responsesResponse.ok ? await responsesResponse.json() : [];

      // Get results if available
      let results;
      try {
        const resultsResponse = await fetch(`https://blob.vercel-storage.com/${this.RESULTS_PREFIX}${surveyId}.json`);
        if (resultsResponse.ok) {
          results = await resultsResponse.json();
        }
      } catch (error) {
        // Results might not exist yet
        console.log('No results found for survey:', surveyId);
      }

      return {
        survey,
        metadata,
        responses,
        results
      };
    } catch (error) {
      console.error('Error retrieving results by admin code:', error);
      return null;
    }
  }

  /**
   * Store survey response
   */
  public static async storeResponse(
    surveyId: string,
    response: SurveyResponse
  ): Promise<void> {
    try {
      // Get existing responses
      const responsesResponse = await fetch(`https://blob.vercel-storage.com/${this.RESPONSES_PREFIX}${surveyId}.json`);
      const existingResponses: SurveyResponse[] = responsesResponse.ok ? await responsesResponse.json() : [];

      // Add new response
      existingResponses.push(response);

      // Store updated responses
      await put(
        `${this.RESPONSES_PREFIX}${surveyId}.json`,
        JSON.stringify(existingResponses, null, 2),
        {
          access: 'public',
          addRandomSuffix: false
        }
      );

      console.log('Response stored successfully for survey:', surveyId);
    } catch (error) {
      console.error('Error storing response:', error);
      throw new Error('Failed to store survey response');
    }
  }

  /**
   * Get all surveys uploaded by an admin
   */
  public static async getSurveysByAdmin(adminUsername: string): Promise<SurveyMetadata[]> {
    try {
      // List all metadata files
      const { blobs } = await list({ prefix: this.METADATA_PREFIX });
      
      const adminSurveys: SurveyMetadata[] = [];
      
      for (const blob of blobs) {
        try {
          const response = await fetch(blob.url);
          if (response.ok) {
            const metadata: SurveyMetadata = await response.json();
            if (metadata.uploadedBy === adminUsername) {
              adminSurveys.push(metadata);
            }
          }
        } catch (error) {
          console.warn('Error reading metadata blob:', blob.pathname, error);
        }
      }

      // Sort by upload date (newest first)
      return adminSurveys.sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
    } catch (error) {
      console.error('Error retrieving admin surveys:', error);
      return [];
    }
  }

  /**
   * Deactivate survey (soft delete)
   */
  public static async deactivateSurvey(surveyId: string, adminUsername: string): Promise<boolean> {
    try {
      // Get metadata
      const metadataResponse = await fetch(`https://blob.vercel-storage.com/${this.METADATA_PREFIX}${surveyId}.json`);
      if (!metadataResponse.ok) {
        return false;
      }

      const metadata: SurveyMetadata = await metadataResponse.json();
      
      // Verify admin owns this survey
      if (metadata.uploadedBy !== adminUsername) {
        return false;
      }

      // Update metadata to mark as inactive
      const updatedMetadata = {
        ...metadata,
        isActive: false,
        deactivatedAt: new Date().toISOString()
      };

      await put(
        `${this.METADATA_PREFIX}${surveyId}.json`,
        JSON.stringify(updatedMetadata, null, 2),
        {
          access: 'public',
          addRandomSuffix: false
        }
      );

      return true;
    } catch (error) {
      console.error('Error deactivating survey:', error);
      return false;
    }
  }

  /**
   * Store computed results
   */
  public static async storeResults(
    surveyId: string,
    results: SurveyResult[]
  ): Promise<void> {
    try {
      await put(
        `${this.RESULTS_PREFIX}${surveyId}.json`,
        JSON.stringify(results, null, 2),
        {
          access: 'public',
          addRandomSuffix: false
        }
      );

      console.log('Results stored successfully for survey:', surveyId);
    } catch (error) {
      console.error('Error storing results:', error);
      throw new Error('Failed to store survey results');
    }
  }

  /**
   * Check if survey exists and is active
   */
  public static async isSurveyActive(surveyId: string): Promise<boolean> {
    try {
      const metadataResponse = await fetch(`https://blob.vercel-storage.com/${this.METADATA_PREFIX}${surveyId}.json`);
      if (!metadataResponse.ok) {
        return false;
      }

      const metadata: SurveyMetadata = await metadataResponse.json();
      return metadata.isActive;
    } catch (error) {
      console.error('Error checking survey status:', error);
      return false;
    }
  }
}