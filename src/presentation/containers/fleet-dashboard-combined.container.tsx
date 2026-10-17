// Combined Maintenance Control page: the Fleet Dashboard with the Review Queue below it.
// Each half keeps its own container (data loading, writes, AI drafting) and view; this file only
// stacks them and hands the dashboard the AI assessment drafter. The /review-queue route
// redirects here.

import * as React from 'react';
import { FleetDashboardScreenContainer } from './fleet-dashboard.container';
import { ReviewQueueScreenContainer } from './review-queue.container';
import { FleetDashboardView } from '../views/fleet-dashboard.view';
import { ReviewQueueView } from '../views/review-queue.view';
import { useAssessmentDrafter } from '../assessment-drafter-context';

type AnyProps = Record<string, unknown>;
const DashboardBase = FleetDashboardView as unknown as React.ComponentType<AnyProps>;

function DashboardWithAi(props: AnyProps): React.ReactElement {
  const drafter = useAssessmentDrafter();
  const extra: AnyProps =
    drafter !== null
      ? { onDraftAssessment: (input: Parameters<typeof drafter.draft>[0]) => drafter.draft(input) }
      : {};
  return <DashboardBase {...props} {...extra} />;
}

export default function FleetDashboardCombinedRoute(): React.ReactElement {
  return (
    <>
      <FleetDashboardScreenContainer
        view={DashboardWithAi as unknown as typeof FleetDashboardView}
      />
      <section id="review-queue" aria-label="Review queue">
        <ReviewQueueScreenContainer view={ReviewQueueView} />
      </section>
    </>
  );
}
