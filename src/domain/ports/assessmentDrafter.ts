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

export interface AssessmentDrafter {
  /** Resolves with the drafted assessment text. Rejects with an `Error` whose message is safe to show. */
  draft(input: AssessmentDraftInput): Promise<string>;
}
