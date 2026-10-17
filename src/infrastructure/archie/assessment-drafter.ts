// Adapter: `AssessmentDrafter` over the Archie SDK AI module (SDK >= 0.7). The only place the AI API is touched.

import type { ArchieClient } from '@archie/js-sdk';
import type {
  AssessmentDraftInput,
  AssessmentDrafter,
} from '../../domain/ports/assessmentDrafter';

type Ai = ArchieClient['ai'];

const SYSTEM = [
  'You help an airline Maintenance Controller write a deferral assessment for an aircraft defect.',
  'Write 3 to 6 short sentences of plain text, no markdown, no headings.',
  'Cover: the likely issue, whether deferral under the linked MEL item looks reasonable, the deferral interval and repair category if given, any operational limitation or maintenance action to mention, and any repeat-defect concern.',
  'Use only the facts provided. If there is no MEL item, say the controller must confirm eligibility against the MEL before deferring.',
  'Never state that the aircraft is airworthy or that deferral is approved. This is a draft the controller will review and edit.',
].join(' ');

function describe(input: AssessmentDraftInput): string {
  const lines: string[] = [];
  const add = (label: string, value: unknown) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      lines.push(`${label}: ${String(value)}`);
    }
  };
  add('Aircraft', [input.tailNumber, input.aircraftType].filter(Boolean).join(' '));
  add('Write-up', input.writeUp);
  add('ATA code', input.ataCode);
  add('Component', input.component);
  add('Symptom', input.symptom);
  add('Repeat count', input.repeatCount);
  add('Classification rationale', input.classificationRationale);
  if (input.melItem) {
    add('MEL item', [input.melItem.itemCode, input.melItem.title].filter(Boolean).join(' - '));
    add('MEL repair category', input.melItem.repairCategory);
    add('MEL deferral interval (days)', input.melItem.deferralInterval);
    add('MEL procedures', input.melItem.procedures);
  } else {
    lines.push('MEL item: none linked');
  }
  input.similarCases.slice(0, 3).forEach((c, i) => {
    add(
      `Similar FAA SDR case ${i + 1}`,
      [c.caseNumber, c.reportedFindings, c.correctiveAction ? `Corrective action: ${c.correctiveAction}` : '']
        .filter(Boolean)
        .join(' | '),
    );
  });
  return lines.join('\n');
}

export function createAssessmentDrafter(ai: Ai): AssessmentDrafter {
  return {
    async draft(input) {
      try {
        const result = await ai.chat({
          system: SYSTEM,
          messages: [{ role: 'user', content: describe(input) }],
          maxTokens: 400,
          temperature: 0.3,
        });
        const text = result.content
          .map((part) => (part.type === 'text' ? part.text : ''))
          .join('')
          .trim();
        if (!text) throw new Error('The AI returned an empty draft. Try again.');
        return text;
      } catch (cause) {
        const code = (cause as { code?: string } | null)?.code;
        console.error('[review-queue] AI draft failed', cause);
        if (cause instanceof Error && cause.message === 'The AI returned an empty draft. Try again.') {
          throw cause;
        }
        if (code === 'rate_limited' || code === 'gate_unavailable') {
          throw new Error('The AI is busy. Try again in a moment.');
        }
        throw new Error('AI drafting is unavailable right now. You can still write the assessment yourself.');
      }
    },
  };
}
