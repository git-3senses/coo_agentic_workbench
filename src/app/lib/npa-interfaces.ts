export type FieldLineage = 'AUTO' | 'ADAPTED' | 'MANUAL';

export interface LineageMetadata {
   sourceDocId?: string;       // e.g., 'TSG1917'
   sourceSnippet?: string;     // The exact text from the source
   adaptationLogic?: string;   // Reasoning for adaptation
   confidenceScore?: number;   // 0-100
   agentTip?: string;          // Helpful prompt for Manual fields
}

export interface NpaField {
   key: string;
   label: string;
   value: string;
   lineage: FieldLineage;
   lineageMetadata?: LineageMetadata;
   type?: 'text' | 'textarea' | 'date' | 'select' | 'currency' | 'file';
   options?: string[]; // For select types
   tooltip?: string;   // Explanation for adaptation or source
   placeholder?: string;
   required?: boolean;
}

export interface NpaSection {
   id: string;
   title: string;
   description?: string;
   fields: NpaField[];
   comments?: string;
   documents?: string[];
}
