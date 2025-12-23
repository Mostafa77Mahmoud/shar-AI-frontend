// frontend/src/contexts/SessionContext.tsx
import { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import * as api from '@/services/api';
// Import CloudinaryFileInfo explicitly
import type { SessionDetailsApiResponse, CloudinaryFileInfo, GenerateModifiedContractApiResponse, GenerateMarkedContractApiResponse, ApiAnalysisTerm, ComplianceStatus } from '@/services/api';

// Type Definitions
export type UserRole = 'regular_user' | 'shariah_expert';

export interface DecisionHistoryEntry {
  action: 'user_edit' | 'ai_review' | 'expert_feedback' | 'confirmation';
  actor: 'user' | 'ai' | 'expert';
  timestamp: string;
  termId?: string;
  details?: string;
}

export interface FrontendAnalysisTerm {
  term_id: string;
  term_text: string;
  is_valid_sharia: boolean;
  compliance_status?: ComplianceStatus;
  sharia_issue?: string;
  reference_number?: string;
  modified_term?: string;

  isUserConfirmed?: boolean;
  userModifiedText?: string | null;
  currentQaAnswer?: string | null;
  currentQaAnswerMeta?: {
    suggested_clause?: string | null;
    reference_standard?: string | null;
  };

  reviewedSuggestion?: string | null;
  isReviewedSuggestionValid?: boolean | null;
  reviewedSuggestionStatus?: ComplianceStatus;
  reviewedSuggestionIssue?: string | null;

  has_expert_feedback?: boolean;
  last_expert_feedback_id?: string | null;
  expert_override_is_valid_sharia?: boolean | null;
}

export interface SessionDetails {
  original_filename: string;
  original_format: string;
  detected_contract_language: 'ar' | 'en';
  analysis_timestamp: string;
  original_contract_plain?: string;
  original_contract_markdown?: string;
  original_cloudinary_info?: CloudinaryFileInfo;
  analysis_results_cloudinary_info?: CloudinaryFileInfo;

  modified_contract_info?: {
    docx_cloudinary_info?: CloudinaryFileInfo;
    txt_cloudinary_info?: CloudinaryFileInfo;
    generation_timestamp: string;
  };
  marked_contract_info?: {
    docx_cloudinary_info?: CloudinaryFileInfo;
    generation_timestamp: string;
  };
  pdf_preview_info?: {
    modified?: CloudinaryFileInfo;
    marked?: CloudinaryFileInfo;
  };
}

interface ComplianceStats {
  totalTerms: number;
  currentUserEffectiveCompliantCount: number;
  currentUserEffectiveNonCompliantCount: number;
  currentUserEffectiveWarningCount: number;
  overallCompliancePercentage: number;
}

interface SessionContextType {
  sessionId: string | null;
  analysisTerms: FrontendAnalysisTerm[] | null;
  complianceStats: ComplianceStats | null;
  sessionDetails: SessionDetails | null;
  decisionHistory: DecisionHistoryEntry[];

  currentUserRole: UserRole;
  toggleUserRole: () => void;

  isUploading: boolean;
  uploadProgress: number;
  isAnalyzingContract: boolean;
  isFetchingSession: boolean;
  isTermProcessing: Record<string, boolean>;
  isGeneratingContract: boolean;
  isGeneratingMarkedContract: boolean;
  isProcessingGeneralQuestion: boolean;
  isReviewingModification: Record<string, boolean>;
  isPreviewLoading: Record<string, boolean>;

  error: string | null;
  uploadError: string | null;
  analysisError: string | null;

  uploadAndAnalyzeContract: (file: File) => Promise<void>;
  askQuestionAboutTerm: (termId: string, question: string) => Promise<string | null>;
  askGeneralContractQuestion: (question: string) => Promise<string | null>;
  reviewUserModification: (termId: string, userTextToReview: string, originalTermText: string) => Promise<boolean>;
  confirmTermModification: (termId: string, textToConfirm: string) => Promise<boolean>;
  generateModifiedContract: () => Promise<GenerateModifiedContractApiResponse | null>;
  generateMarkedContract: () => Promise<GenerateMarkedContractApiResponse | null>;
  refreshSessionData: () => Promise<boolean>;

  updatePdfPreviewInfo: (type: 'modified' | 'marked', pdfInfo: CloudinaryFileInfo) => void;
  updateTermLocally: (params: Partial<FrontendAnalysisTerm> & { term_id: string }) => void;
  addDecisionHistory: (entry: DecisionHistoryEntry) => void;
  clearSession: () => void;
  setPreviewLoading: (key: string, isLoading: boolean) => void;
}

const defaultSessionContextState: SessionContextType = {
  sessionId: null,
  analysisTerms: null,
  complianceStats: null,
  sessionDetails: null,
  decisionHistory: [],
  currentUserRole: (typeof window !== 'undefined' ? localStorage.getItem('shariaaAnalyzerUserRole') as UserRole : null) || 'regular_user',
  toggleUserRole: () => {},
  isUploading: false,
  uploadProgress: 0,
  isAnalyzingContract: false,
  isFetchingSession: false,
  isTermProcessing: {},
  isGeneratingContract: false,
  isGeneratingMarkedContract: false,
  isProcessingGeneralQuestion: false,
  isReviewingModification: {},
  isPreviewLoading: {},
  error: null,
  uploadError: null,
  analysisError: null,
  uploadAndAnalyzeContract: async () => {},
  askQuestionAboutTerm: async () => null,
  askGeneralContractQuestion: async () => null,
  reviewUserModification: async () => false,
  confirmTermModification: async () => false,
  generateModifiedContract: async () => null,
  generateMarkedContract: async () => null,
  refreshSessionData: async () => false,
  updatePdfPreviewInfo: () => {},
  updateTermLocally: () => {},
  addDecisionHistory: () => {},
  clearSession: () => {},
  setPreviewLoading: () => {},
};

const SessionContext = createContext<SessionContextType>(defaultSessionContextState);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const [sessionIdState, setSessionIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('shariaaAnalyzerSessionId');
    }
    return null;
  });
  const [analysisTermsState, setAnalysisTermsState] = useState<FrontendAnalysisTerm[] | null>(null);
  const [sessionDetailsState, setSessionDetailsState] = useState<SessionDetails | null>(null);
  const [decisionHistoryState, setDecisionHistoryState] = useState<DecisionHistoryEntry[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(defaultSessionContextState.currentUserRole);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAnalyzingContract, setIsAnalyzingContract] = useState(false);
  const [isFetchingSession, setIsFetchingSession] = useState(false);
  const [isTermProcessing, setIsTermProcessing] = useState<Record<string, boolean>>({});
  const [isGeneratingContractState, setIsGeneratingContractState] = useState(false);
  const [isGeneratingMarkedContractState, setIsGeneratingMarkedContractState] = useState(false);
  const [isProcessingGeneralQuestion, setIsProcessingGeneralQuestion] = useState(false);
  const [isReviewingModification, setIsReviewingModification] = useState<Record<string, boolean>>({});
  const [isPreviewLoadingState, setIsPreviewLoadingState] = useState<Record<string, boolean>>({});

  const [errorState, setErrorState] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('shariaaAnalyzerUserRole', currentUserRole);
    }
  }, [currentUserRole]);

  const toggleUserRole = useCallback(() => {
    setCurrentUserRole(prevRole => {
      const newRole = prevRole === 'regular_user' ? 'shariah_expert' : 'regular_user';
      toast({ title: "Mode Switched", description: `Switched to ${newRole === 'shariah_expert' ? 'Shariah Expert' : 'Regular User'} mode.` });
      return newRole;
    });
  }, [toast]);

  const clearSession = useCallback(() => {
    setSessionIdState(null);
    setAnalysisTermsState(null);
    setSessionDetailsState(null);
    setDecisionHistoryState([]);
    setIsUploading(false);
    setUploadProgress(0);
    setIsAnalyzingContract(false);
    setIsFetchingSession(false);
    setIsTermProcessing({});
    setIsGeneratingContractState(false);
    setIsGeneratingMarkedContractState(false);
    setIsProcessingGeneralQuestion(false);
    setIsReviewingModification({});
    setIsPreviewLoadingState({});
    setErrorState(null);
    setUploadError(null);
    setAnalysisError(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('shariaaAnalyzerSessionId');
    }
  }, []);

  const loadSessionData = useCallback(async (sid: string) => {
    setIsFetchingSession(true);
    setErrorState(null);
    try {
      const [sessionData, termsData] = await Promise.all([
        api.getSessionDetailsApi(sid),
        api.getSessionTermsApi(sid)
      ]);

      setSessionIdState(sessionData.session_id);
      setSessionDetailsState({
        original_filename: sessionData.original_filename,
        original_format: sessionData.original_format,
        detected_contract_language: sessionData.detected_contract_language,
        analysis_timestamp: sessionData.analysis_timestamp,
        original_contract_plain: sessionData.original_contract_plain,
        original_contract_markdown: sessionData.original_contract_markdown,
        original_cloudinary_info: sessionData.original_cloudinary_info,
        analysis_results_cloudinary_info: sessionData.analysis_results_cloudinary_info,
        modified_contract_info: sessionData.modified_contract_info,
        marked_contract_info: sessionData.marked_contract_info,
        pdf_preview_info: sessionData.pdf_preview_info,
      });

      const frontendTerms: FrontendAnalysisTerm[] = termsData.map((term: ApiAnalysisTerm) => ({
        term_id: term.term_id,
        term_text: term.term_text,
        is_valid_sharia: term.is_valid_sharia,
        compliance_status: term.compliance_status,
        sharia_issue: term.sharia_issue,
        reference_number: term.reference_number,
        modified_term: term.modified_term,
        isUserConfirmed: term.is_confirmed_by_user || false,
        userModifiedText: term.confirmed_modified_text || null,
        currentQaAnswer: null,
        currentQaAnswerMeta: undefined,
        reviewedSuggestion: null,
        isReviewedSuggestionValid: null,
        reviewedSuggestionStatus: undefined,
        reviewedSuggestionIssue: null,
        has_expert_feedback: term.has_expert_feedback || false,
        last_expert_feedback_id: term.last_expert_feedback_id || null,
        expert_override_is_valid_sharia: term.expert_override_is_valid_sharia === undefined ? null : term.expert_override_is_valid_sharia,
      }));
      setAnalysisTermsState(frontendTerms);

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('shariaaAnalyzerSessionId', sid);
      }
    } catch (err: any) {
      console.error("Failed to load session:", err);
      const errorMessage = err.message || "Failed to load previous session.";
      setErrorState(errorMessage);
      toast({ variant: "destructive", title: "Session Load Error", description: errorMessage });
      clearSession();
    } finally {
      setIsFetchingSession(false);
    }
  }, [toast, clearSession]);

  const refreshSessionData = useCallback(async (): Promise<boolean> => {
    if (!sessionIdState) {
      setErrorState("No active session to refresh.");
      toast({ variant: "destructive", title: "Session Error", description: "No active session." });
      return false;
    }
    try {
      await loadSessionData(sessionIdState);
      return true;
    } catch (error) {
      console.error("Refresh session failed", error);
      return false;
    }
  }, [loadSessionData, sessionIdState, toast]);

  useEffect(() => {
    const loadStoredSession = async () => {
      if (typeof window !== 'undefined') {
        const storedSessionId = sessionStorage.getItem('shariaaAnalyzerSessionId');
        if (storedSessionId && !analysisTermsState && !isFetchingSession) {
          await loadSessionData(storedSessionId);
        }
      }
    };
    loadStoredSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadAndAnalyzeContract = async (file: File) => {
    clearSession();
    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setAnalysisError(null);
    setErrorState(null);
    setIsAnalyzingContract(true);

    try {
      const response = await api.uploadContractForAnalysis(file, setUploadProgress);
      await loadSessionData(response.session_id);
      toast({ title: "Analysis Complete", description: response.message || "Contract analyzed successfully." });
    } catch (err: any) {
      console.error("Upload/Analysis Error:", err);
      const errorMessage = err.message || "Failed to upload or analyze contract.";
      setAnalysisError(errorMessage);
      setErrorState(errorMessage);
      toast({ variant: "destructive", title: "Error", description: errorMessage });
    } finally {
      setIsUploading(false);
      setIsAnalyzingContract(false);
      setUploadProgress(0);
    }
  };

  const askQuestionAboutTerm = async (termId: string, question: string): Promise<string | null> => {
    if (!sessionIdState || !analysisTermsState) {
        setErrorState("No active session. Please upload a contract first.");
        toast({ variant: "destructive", title: "Session Error", description: "No active session." });
        return null;
    }
    const termInQuestion = analysisTermsState.find(t => t.term_id === termId);
    if (!termInQuestion) {
        setErrorState("Term not found for asking question.");
        toast({ variant: "destructive", title: "Application Error", description: "Term not found." });
        return null;
    }
    setIsTermProcessing(prev => ({ ...prev, [termId]: true }));
    setErrorState(null);
    try {
      const response = await api.askQuestion(sessionIdState, question, termId, termInQuestion.term_text);
      const answerText = response.answer || response.response || '';
      updateTermLocally({ 
        term_id: termId, 
        currentQaAnswer: answerText,
        currentQaAnswerMeta: {
          suggested_clause: response.suggested_clause || null,
          reference_standard: response.reference_standard || null,
        }
      });
      return answerText;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to get answer for the term.";
      setErrorState(errorMessage);
      toast({ variant: "destructive", title: "Interaction Error", description: errorMessage });
      return null;
    } finally { setIsTermProcessing(prev => ({ ...prev, [termId]: false })); }
  };

  const askGeneralContractQuestion = async (question: string): Promise<string | null> => {
    if (!sessionIdState) {
        setErrorState("No active session. Please upload a contract first.");
        toast({ variant: "destructive", title: "Session Error", description: "No active session." });
        return null;
    }
    setIsProcessingGeneralQuestion(true);
    setErrorState(null);
    try {
        const response = await api.askQuestion(sessionIdState, question);
        return response.answer || response.response || '';
    } catch (err: any) {
        const errorMessage = err.message || "Failed to get answer for the general question.";
        setErrorState(errorMessage);
        toast({ variant: "destructive", title: "Interaction Error", description: errorMessage });
        return null;
    } finally { setIsProcessingGeneralQuestion(false); }
  };

  const reviewUserModification = async (termId: string, userTextToReview: string, originalTermText: string): Promise<boolean> => {
    if (!sessionIdState) {
        toast({ variant: "destructive", title: "Session Error", description: "No active session." });
        return false;
    }
    console.debug("[Session] reviewUserModification:start", { termId });
    setIsReviewingModification(prev => ({ ...prev, [termId]: true }));
    setErrorState(null);
    try {
        const reviewResponse = await api.reviewUserModificationApi(sessionIdState, termId, userTextToReview, originalTermText);
        console.debug("[Session] reviewUserModification:success", { termId, compliance_status: reviewResponse.compliance_status });
        updateTermLocally({
            term_id: termId,
            userModifiedText: reviewResponse.reviewed_text,
            reviewedSuggestion: reviewResponse.reviewed_text,
            isReviewedSuggestionValid: reviewResponse.is_still_valid_sharia,
            reviewedSuggestionStatus: reviewResponse.compliance_status,
            reviewedSuggestionIssue: reviewResponse.sharia_issue || reviewResponse.new_sharia_issue || null,
            currentQaAnswer: null,
            isUserConfirmed: false,
        });
        setDecisionHistoryState(prev => [...prev, {
          action: 'ai_review',
          actor: 'ai',
          timestamp: new Date().toISOString(),
          termId,
          details: `AI reviewed user modification for ${termId}`
        }]);
        toast({ title: "Review Complete", description: "Your modification has been reviewed by AI." });
        return true;
    } catch (err: any) {
        const errorMessage = err.message || "Failed to review modification.";
        setErrorState(errorMessage);
        toast({ variant: "destructive", title: "Review Error", description: errorMessage });
        return false;
    } finally { 
      setIsReviewingModification(prev => ({ ...prev, [termId]: false }));
      console.debug("[Session] reviewUserModification:complete", { termId });
    }
  };

  const confirmTermModification = async (termId: string, textToConfirm: string): Promise<boolean> => {
    if (!sessionIdState) {
        setErrorState("No active session.");
        toast({ variant: "destructive", title: "Session Error", description: "No active session." });
        return false;
    }
    console.debug("[Session] confirmTermModification:start", { termId });
    setIsTermProcessing(prev => ({ ...prev, [termId]: true }));
    setErrorState(null);
    try {
      const response = await api.confirmTermModificationApi(sessionIdState, termId, textToConfirm);
      if (response.success) {
        // Refetch the session terms to get the accurate updated state from backend
        const updatedTermsData = await api.getSessionTermsApi(sessionIdState);
        
        // Map the updated terms to frontend format
        const updatedFrontendTerms: FrontendAnalysisTerm[] = updatedTermsData.map((term: api.ApiAnalysisTerm) => {
          const existingTerm = analysisTermsState?.find(t => t.term_id === term.term_id);
          return {
            term_id: term.term_id,
            term_text: term.term_text,
            is_valid_sharia: term.is_valid_sharia,
            compliance_status: term.compliance_status,
            sharia_issue: term.sharia_issue,
            reference_number: term.reference_number,
            modified_term: term.modified_term,
            isUserConfirmed: term.is_confirmed_by_user || false,
            userModifiedText: term.confirmed_modified_text || null,
            currentQaAnswer: existingTerm?.currentQaAnswer || null,
            currentQaAnswerMeta: existingTerm?.currentQaAnswerMeta,
            reviewedSuggestion: null,
            isReviewedSuggestionValid: null,
            reviewedSuggestionStatus: null,
            reviewedSuggestionIssue: null,
            has_expert_feedback: term.has_expert_feedback || false,
            last_expert_feedback_id: term.last_expert_feedback_id || null,
            expert_override_is_valid_sharia: term.expert_override_is_valid_sharia === undefined ? null : term.expert_override_is_valid_sharia,
          };
        });
        
        setAnalysisTermsState(updatedFrontendTerms);
        console.debug("[Session] confirmTermModification:stateUpdated", { termId, updatedCount: updatedFrontendTerms.length });
        setDecisionHistoryState(prev => [...prev, {
          action: 'confirmation',
          actor: 'user',
          timestamp: new Date().toISOString(),
          termId,
          details: `User confirmed modification for ${termId}`
        }]);
        return true;
      }
      const errorMessage = response.message || "Failed to confirm modification on backend.";
      setErrorState(errorMessage);
      toast({ variant: "destructive", title: "Confirmation Error", description: errorMessage });
      return false;
    } catch (err: any) {
        const errorMessage = err.message || "Failed to confirm term modification.";
        setErrorState(errorMessage);
        toast({ variant: "destructive", title: "Confirmation Error", description: errorMessage });
        return false;
    } finally { 
      setIsTermProcessing(prev => ({ ...prev, [termId]: false }));
      console.debug("[Session] confirmTermModification:complete", { termId });
    }
  };

  const generateModifiedContract = async (): Promise<api.GenerateModifiedContractApiResponse | null> => {
    if (!sessionIdState || !sessionDetailsState) {
      setErrorState("No active session or session details missing.");
      toast({ variant: "destructive", title: "Session Error", description: "No active session or session details missing." });
      return null;
    }
    setIsGeneratingContractState(true);
    setErrorState(null);
    try {
      const response = await api.generateModifiedContractApi(sessionIdState);
      if (response.success) {
        const baseFilename = sessionDetailsState.original_filename.replace(/\.[^/.]+$/, "");
        const docxInfo: CloudinaryFileInfo | undefined = response.modified_docx_cloudinary_url
            ? { url: response.modified_docx_cloudinary_url, public_id: '', format: 'docx', user_facing_filename: `modified_${baseFilename}.docx` }
            : undefined;
        const txtInfo: CloudinaryFileInfo | undefined = response.modified_txt_cloudinary_url
            ? { url: response.modified_txt_cloudinary_url, public_id: '', format: 'txt', user_facing_filename: `modified_${baseFilename}.txt` }
            : undefined;

        setSessionDetailsState(prev => prev ? ({
          ...prev,
          modified_contract_info: {
            docx_cloudinary_info: docxInfo,
            txt_cloudinary_info: txtInfo,
            generation_timestamp: new Date().toISOString(),
          }
        }) : null);
      }
      return response;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to generate modified contract.";
      setErrorState(errorMessage);
      toast({ variant: "destructive", title: "Generation Error", description: errorMessage });
      return null;
    } finally { setIsGeneratingContractState(false); }
  };

  const generateMarkedContract = async (): Promise<api.GenerateMarkedContractApiResponse | null> => {
    if (!sessionIdState || !sessionDetailsState) {
      setErrorState("No active session or session details missing.");
      toast({ variant: "destructive", title: "Session Error", description: "No active session or session details missing." });
      return null;
    }
    setIsGeneratingMarkedContractState(true);
    setErrorState(null);
    try {
      const response = await api.generateMarkedContractApi(sessionIdState);
      if (response.success) {
        const baseFilename = sessionDetailsState.original_filename.replace(/\.[^/.]+$/, "");
        const docxInfo: CloudinaryFileInfo | undefined = response.marked_docx_cloudinary_url
            ? { url: response.marked_docx_cloudinary_url, public_id: '', format: 'docx', user_facing_filename: `marked_${baseFilename}.docx` }
            : undefined;

        setSessionDetailsState(prev => prev ? ({
          ...prev,
          marked_contract_info: {
            docx_cloudinary_info: docxInfo,
            generation_timestamp: new Date().toISOString(),
          }
        }) : null);
      }
      return response;
    } catch (err: any) {
      const errorMessage = err.message || "Failed to generate marked contract.";
      setErrorState(errorMessage);
      toast({ variant: "destructive", title: "Generation Error", description: errorMessage });
      return null;
    } finally { setIsGeneratingMarkedContractState(false); }
  };

  const updateTermLocally = useCallback((params: Partial<FrontendAnalysisTerm> & { term_id: string }) => {
    setAnalysisTermsState(prevTerms => {
      if (!prevTerms) return null;
      return prevTerms.map(term =>
        term.term_id === params.term_id ? { ...term, ...params } : term
      );
    });
  }, []);

  const updatePdfPreviewInfo = useCallback((type: 'modified' | 'marked', pdfInfo: CloudinaryFileInfo) => {
    setSessionDetailsState(prev => {
        if (!prev) return null;
        return {
            ...prev,
            pdf_preview_info: {
                ...prev.pdf_preview_info,
                [type]: pdfInfo,
            },
        };
    });
  }, []);


  const complianceStats: ComplianceStats | null = useMemo(() => {
    if (!analysisTermsState) return null;
    const totalTerms = analysisTermsState.length;
    if (totalTerms === 0) return { totalTerms: 0, currentUserEffectiveCompliantCount: 0, currentUserEffectiveWarningCount: 0, currentUserEffectiveNonCompliantCount: 0, overallCompliancePercentage: 0 };

    let compliantCount = 0, warningCount = 0, nonCompliantCount = 0;
    
    analysisTermsState.forEach(t => {
        let effectiveStatus = t.compliance_status || 'compliant';
        
        if (t.expert_override_is_valid_sharia !== null && t.expert_override_is_valid_sharia !== undefined) {
            effectiveStatus = t.expert_override_is_valid_sharia ? 'compliant' : 'non_compliant';
        } else if (t.isUserConfirmed) {
            effectiveStatus = t.compliance_status || 'compliant';
        } else if (t.reviewedSuggestionStatus) {
            effectiveStatus = t.reviewedSuggestionStatus;
        } else if (t.isReviewedSuggestionValid !== null && t.isReviewedSuggestionValid !== undefined) {
            effectiveStatus = t.isReviewedSuggestionValid ? 'compliant' : 'non_compliant';
        }
        
        if (effectiveStatus === 'compliant') compliantCount++;
        else if (effectiveStatus === 'warning') warningCount++;
        else nonCompliantCount++;
    });

    return {
      totalTerms: totalTerms,
      currentUserEffectiveCompliantCount: compliantCount,
      currentUserEffectiveWarningCount: warningCount,
      currentUserEffectiveNonCompliantCount: nonCompliantCount,
      overallCompliancePercentage: totalTerms > 0 ? (compliantCount / totalTerms) * 100 : 0,
    };
  }, [analysisTermsState]);

  const setPreviewLoading = useCallback((key: string, isLoading: boolean) => {
    setIsPreviewLoadingState(prev => ({ ...prev, [key]: isLoading }));
  }, []);

  return (
    <SessionContext.Provider value={{
      sessionId: sessionIdState,
      analysisTerms: analysisTermsState,
      complianceStats,
      sessionDetails: sessionDetailsState,
      decisionHistory: decisionHistoryState,
      currentUserRole,
      toggleUserRole,
      isUploading,
      uploadProgress,
      isAnalyzingContract,
      isFetchingSession,
      isTermProcessing,
      isGeneratingContract: isGeneratingContractState,
      isGeneratingMarkedContract: isGeneratingMarkedContractState,
      isProcessingGeneralQuestion,
      isReviewingModification,
      isPreviewLoading: isPreviewLoadingState,
      error: errorState,
      uploadError,
      analysisError,
      uploadAndAnalyzeContract,
      askQuestionAboutTerm,
      askGeneralContractQuestion,
      reviewUserModification,
      confirmTermModification,
      generateModifiedContract,
      generateMarkedContract,
      refreshSessionData,
      updatePdfPreviewInfo,
      updateTermLocally,
      addDecisionHistory: (entry: DecisionHistoryEntry) => setDecisionHistoryState(prev => [...prev, entry]),
      clearSession,
      setPreviewLoading,
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
