// Combined Maintenance Control page: the Fleet Dashboard with the Review Queue below it.
// Each half keeps its own container (data loading, writes, AI drafting) and view; this file only
// stacks them. The /review-queue route now redirects here.

import * as React from 'react';
import { FleetDashboardScreenContainer } from './fleet-dashboard.container';
import { ReviewQueueScreenContainer } from './review-queue.container';
import { FleetDashboardView } from '../views/fleet-dashboard.view';
import { ReviewQueueView } from '../views/review-queue.view';

export default function FleetDashboardCombinedRoute(): React.ReactElement {
  return (
    <>
      <FleetDashboardScreenContainer view={FleetDashboardView} />
      <section id="review-queue" aria-label="Review queue">
        <ReviewQueueScreenContainer view={ReviewQueueView} />
      </section>
    </>
  );
}
