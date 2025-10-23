// Shared TypeScript interfaces and types for SmartProof Frontend

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export enum UserRole {
  ADMIN = 'admin',
  PROOF_MANAGER = 'proof_manager',
  REVIEWER = 'reviewer',
  AGENCY_USER = 'agency_user',
}

export interface UploadAsset {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
  status: AssetStatus;
  processingProgress?: number;
}

export enum AssetStatus {
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface ComplianceReport {
  id: string;
  assetId: string;
  fileName: string;
  processedAt: string;
  overallStatus: ComplianceStatus;
  textCompliance: TextComplianceResult;
  imageCompliance: ImageComplianceResult[];
  summary: ComplianceSummary;
  reportUrl: string;
  pdfReportUrl: string;
}

export enum ComplianceStatus {
  PASSED = 'passed',
  FAILED = 'failed',
  WARNING = 'warning',
  PENDING = 'pending',
}

export interface TextComplianceResult {
  passed: boolean;
  issues: ComplianceIssue[];
  rulesChecked: number;
  rulesPassed: number;
}

export interface ImageComplianceResult {
  imageId: string;
  imagePath: string;
  pageNumber: number;
  passed: boolean;
  analysis: ImageAnalysis;
  issues: ComplianceIssue[];
}

export interface ImageAnalysis {
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
}

export interface ComplianceIssue {
  id: string;
  severity: IssueSeverity;
  category: IssueCategory;
  message: string;
  location?: string;
  suggestion?: string;
  confidence: number;
  ruleId?: string;
  source?: string;
}

export enum IssueSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum IssueCategory {
  BRAND = 'brand',
  LEGAL = 'legal',
  PIT = 'pit',
  IMAGE_QUALITY = 'image_quality',
  LOGO = 'logo',
  COLOR = 'color',
  TEXT = 'text',
}

export interface ComplianceSummary {
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  imagesAnalyzed: number;
  pagesProcessed: number;
  overallConfidence: number;
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface UploadProgress {
  uploadId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  message?: string;
}
