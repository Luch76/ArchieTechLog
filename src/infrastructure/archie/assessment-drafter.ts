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

/** Rule-based draft from the same facts, used when the AI service cannot answer. */
function templateDraft(input: AssessmentDraftInput): string {
  const s: string[] = [];
  const plane = [input.tailNumber, input.aircraftType].filter(Boolean).join(' ');
  const issue = [input.component, input.symptom].filter(Boolean).join(': ') || input.writeUp;
  s.push(`${plane ? `${plane} reports` : 'Reported'} ${issue}${input.ataCode ? ` (ATA ${input.ataCode})` : ''}.`);
  const m = input.melItem;
  if (m && (m.itemCode || m.title)) {
    const ref = [m.itemCode, m.title].filter(Boolean).join(' - ');
    const cat = m.repairCategory ? ` Repair category ${m.repairCategory}` : '';
    const days = typeof m.deferralInterval === 'number' ? `${cat ? ', ' : ' '}deferral interval ${m.deferralInterval} days` : '';
    s.push(`MEL item ${ref} appears to apply.${cat}${days}${cat || days ? '.' : ''} Confirm the item's conditions and any operational limitations before deferring.`);
  } else {
    s.push('No MEL item is linked, so MEL eligibility must be confirmed before this defect is deferred.');
  }
  if ((input.repeatCount ?? 0) > 1) {
    s.push(`This is a repeat defect (${input.repeatCount} occurrences); consider troubleshooting beyond the deferral.`);
  }
  const c = input.similarCases.find((x) => x.correctiveAction);
  if (c) s.push(`A similar FAA SDR case${c.caseNumber ? ` (${c.caseNumber})` : ''} was resolved by: ${c.correctiveAction}.`);
  s.push('Draft for controller review; edit before confirming.');
  return s.join(' ');
}

const ATA_SYSTEM = [
  'You classify an aircraft defect write-up into its ATA iSpec 2200 chapter and section.',
  'Answer ONLY with JSON: {"ataChapter":"NN","ataSection":"NN"}, two digits each (for example air conditioning is 21 and 50).',
  'Use only the write-up. If you cannot decide, answer {"ataChapter":"","ataSection":""}.',
].join(' ');

function parseAtaAnswer(text: string): { ataChapter: string; ataSection: string } | null {
  const json = /\{[\s\S]*\}/.exec(text);
  if (json) {
    try {
      const o = JSON.parse(json[0]) as { ataChapter?: unknown; ataSection?: unknown };
      const ch = String(o.ataChapter ?? '').replace(/\D/g, '').padStart(2, '0').slice(-2);
      const se = String(o.ataSection ?? '').replace(/\D/g, '').padStart(2, '0').slice(-2);
      if (String(o.ataChapter ?? '').trim() !== '' && ch !== '00') return { ataChapter: ch, ataSection: se };
    } catch {
      /* fall through to the pattern below */
    }
  }
  const m = /(\d{2})\s*[-\u2013 ]\s*(\d{2})/.exec(text);
  return m ? { ataChapter: m[1] as string, ataSection: m[2] as string } : null;
}

const MEL_SYSTEM = [
  'You match an aircraft defect write-up to the Minimum Equipment List (MEL) item that covers it.',
  'You receive a numbered candidate list. Answer ONLY with JSON: {"number":N} where N is the best candidate.',
  'Match by affected system and component, not by exact wording: for example an inoperative air conditioning or cabin temperature problem relates to pressurization, pneumatic or bleed air items; a generator fault relates to generator or APU generator items.',
  'Choose the closest related candidate. Answer {"number":0} only if every candidate is about an unrelated system. Never invent a candidate.',
].join(' ');

export function createAssessmentDrafter(ai: Ai): AssessmentDrafter {
  return {
    async selectMel(input) {
      const list = input.candidates.slice(0, 150);
      if (list.length === 0) return null;
      try {
        const lines = list.map(
          (c, i) => `${i + 1}. ${c.itemCode ?? ''} | ATA ${c.ataCode ?? '?'} | ${c.title ?? ''}`,
        );
        const ata =
          input.ataChapter ? `ATA chapter/section: ${input.ataChapter}-${input.ataSection ?? ''}\n` : '';
        const request = {
          system: MEL_SYSTEM,
          messages: [
            {
              role: 'user' as const,
              content: `${ata}Write-up: ${input.writeUp}\n\nCandidates:\n${lines.join('\n')}`,
            },
          ],
          maxTokens: 30,
          temperature: 0,
        };
        const result = await ai.chat({ ...request, provider: 'openai' }).catch(() => ai.chat(request));
        const text = result.content
          .map((part) => (part.type === 'text' ? part.text : ''))
          .join('')
          .trim();
        const m = /"?number"?\s*:\s*(\d+)/.exec(text) ?? /^(\d+)/.exec(text);
        const n = m ? Number(m[1]) : 0;
        return n >= 1 && n <= list.length ? (list[n - 1] as { id: string }).id : null;
      } catch (cause) {
        console.error('[defect-guidance] MEL selection failed', cause);
        return null;
      }
    },
    async classifyAta(input) {
      try {
        const request = {
          system: ATA_SYSTEM,
          messages: [
            {
              role: 'user' as const,
              content: `${input.aircraftType ? `Aircraft type: ${input.aircraftType}\n` : ''}Write-up: ${input.writeUp}`,
            },
          ],
          maxTokens: 60,
          temperature: 0,
        };
        const result = await ai.chat({ ...request, provider: 'openai' }).catch(() => ai.chat(request));
        const text = result.content
          .map((part) => (part.type === 'text' ? part.text : ''))
          .join('')
          .trim();
        return parseAtaAnswer(text);
      } catch (cause) {
        console.error('[defect-guidance] ATA classification failed', cause);
        return null;
      }
    },
    async draft(input) {
      try {
        const request = {
          system: SYSTEM,
          messages: [{ role: 'user' as const, content: describe(input) }],
          maxTokens: 400,
          temperature: 0.3,
        };
        // OpenAI first through the Archie AI service; if it refuses, use the project's default provider.
        const result = await ai.chat({ ...request, provider: 'openai' }).catch((first: unknown) => {
          console.error('[review-queue] OpenAI draft failed, trying default provider', first);
          return ai.chat(request);
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
        void code;
        return templateDraft(input);
      }
    },
  };
}
