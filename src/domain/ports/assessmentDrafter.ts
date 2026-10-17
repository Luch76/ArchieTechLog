// Port: drafts a controller's deferral assessment with AI. Advisory only: the controller
// reads, edits and owns whatever is recorded. Implemented in `infrastructure/archie/`.

export interface AssessmentDraftInput {
  readonly tailNumber?: string;
  readonly aircraftType?: string;
  readonly writeUp: string;
  readonly ataCode?: string;
  readonly component?: string;
  readonly symptom?: string;
  readonly repeatCount?: number;
  readonly classificationRationale?: string;
  readonly melItem?: {
    readonly itemCode?: string;
    readonly title?: string;
    readonly repairCategory?: string;
    readonly deferralInterval?: number;
    readonly procedures?: string;
  };
  readonly similarCases: ReadonlyArray<{
    readonly caseNumber?: string;
    readonly reportedFindings?: string;
    readonly correctiveAction?: string;
  }>;
}

export interface AtaClassification {
  readonly ataChapter: string;
  readonly ataSection: string;
}

export interface MelCandidate {
  readonly id: string;
  readonly itemCode?: string;
  readonly title?: string;
  readonly ataCode?: string;
}

export interface AssessmentDrafter {
  /** Picks the MEL item that best covers the write-up from the candidates. Resolves the candidate id, or null when none fits. */
  selectMel(input: {
    readonly writeUp: string;
    readonly ataChapter?: string;
    readonly ataSection?: string;
    readonly candidates: ReadonlyArray<MelCandidate>;
  }): Promise<string | null>;
  /** Classifies a write-up into an ATA chapter and section (two digits each). Resolves null when the AI cannot decide. */
  classifyAta(input: { readonly writeUp: string; readonly aircraftType?: string }): Promise<AtaClassification | null>;
  /** Resolves with the drafted assessment text. Rejects with an `Error` whose message is safe to show. */
  draft(input: AssessmentDraftInput): Promise<string>;
}
