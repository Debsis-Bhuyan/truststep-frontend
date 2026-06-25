export type DocType = 'AADHAAR' | 'PAN' | 'BUSINESS_PROOF' | 'BANK_STATEMENT';
export type DocStatus = 'UPLOADED' | 'VERIFIED' | 'REJECTED';

export interface LoanDocumentResponse {
  id: number;
  loanId: number;
  fileName: string;
  docType: DocType;
  status: DocStatus;
  uploadedAt: string;
  fileUrl: string;
}
