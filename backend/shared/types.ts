// Shared TypeScript types for SmartProof Backend

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

export interface UploadAsset {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
  status: AssetStatus;
  blobPath: string;
  metadata?: AssetMetadata;
}

export interface AssetMetadata {
  model?: string;
  year?: string;
  category?: string;
}

export enum AssetStatus {
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface WorkflowState {
  uploadId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  currentAgent: string;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  agents: {
    [agentName: string]: AgentResult;
  };
  error?: string;
}

export interface AgentResult {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  output?: any;
  error?: string;
}

export interface ProcessedAsset {
  uploadId: string;
  fileName: string;
  extractedText: string;
  extractedTables: Table[];
  extractedImages: ExtractedImage[];
  pageCount: number;
  processedAt: string;
}

export interface Table {
  id: string;
  pageNumber: number;
  rows: string[][];
  headers?: string[];
}

export interface ExtractedImage {
  imageId: string;
  blobPath: string;
  pageNumber: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ImageAnalysisResult {
  imageId: string;
  imagePath: string;
  pageNumber: number;
  passed: boolean;
  analysis: {
    logoDetected: boolean;
    logoPosition?: {
      x: number;
      y: number;
      width: number;
      height: number;
      confidence: number;
    };
    imageQuality: {
      resolution: string;
      dpi: number;
      isBlurry: boolean;
      qualityScore: number;
    };
    dominantColors: string[];
    objectsDetected: string[];
    textInImage?: string;
    brandCompliance: {
      logoUsage: string;
      colorConsistency: string;
      visualStyle: string;
      issues: string[];
    };
  };
  issues: ComplianceIssue[];
}

export interface ComplianceIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'brand' | 'legal' | 'pit' | 'image_quality' | 'logo' | 'color' | 'text';
  message: string;
  location?: string;
  suggestion?: string;
  confidence: number;
  ruleId?: string;
  source?: string;
}

export interface ComplianceReport {
  id: string;
  assetId: string;
  fileName: string;
  processedAt: string;
  overallStatus: 'passed' | 'failed' | 'warning' | 'pending';
  textCompliance: {
    passed: boolean;
    issues: ComplianceIssue[];
    rulesChecked: number;
    rulesPassed: number;
  };
  imageCompliance: ImageAnalysisResult[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
    imagesAnalyzed: number;
    pagesProcessed: number;
    overallConfidence: number;
  };
  reportUrl: string;
  pdfReportUrl: string;
}

export interface ProductSearchQuery {
  query: string;
  model?: string;
  year?: string;
  category?: string;
}

export interface ProductSearchResult {
  id: string;
  title: string;
  content: string;
  model: string;
  year: string;
  category: string;
  relevanceScore: number;
  source: string;
}

export interface BlobUploadResult {
  blobName: string;
  blobUrl: string;
  containerName: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'proof_manager' | 'reviewer' | 'agency_user';
}
