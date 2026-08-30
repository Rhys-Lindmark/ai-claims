export type ConflictCategory = 'employment' | 'financial' | 'personal' | 'prior_advocacy' | 'none';
export interface ReviewerDisclosure { disclosure_id: string; reviewer_id: string; category: ConflictCategory; statement: string; disclosed_at: string; public: boolean; }
export interface ReviewAssignment { assignment_id: string; finding_id: string; reviewer_id: string; role: 'researcher' | 'editor' | 'final_approver'; conflict_state: 'none_declared' | 'disclosed_managed' | 'recused'; disclosure_ids: string[]; recusal_reason: string | null; replacement_reviewer_id: string | null; }
