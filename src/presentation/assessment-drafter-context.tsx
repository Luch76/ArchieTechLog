// DI for the AI assessment drafter. Received by PROP from the composition root (L37);
// `null` when no provider is mounted, so screens simply hide the AI button.

import * as React from 'react';
import type { AssessmentDrafter } from '../domain/ports/assessmentDrafter';

const AssessmentDrafterContext = React.createContext<AssessmentDrafter | null>(null);

export function AssessmentDrafterProvider(props: {
  readonly drafter: AssessmentDrafter;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return React.createElement(AssessmentDrafterContext.Provider, {
    value: props.drafter,
    children: props.children,
  });
}

export function useAssessmentDrafter(): AssessmentDrafter | null {
  return React.useContext(AssessmentDrafterContext);
}
