import { OverviewController } from '../src/host/overview-controller';
import { OverviewError } from '../src/modules/operational-overview/domain/overview';
import type { PlatformRuntime } from '../src/host/runtime';
import type { OperationalOverview } from '../src/modules/operational-overview/application/overview';
import type { IncomingMessage } from 'node:http';
const request = { url: '/api/v1/overview/context' } as IncomingMessage;
function controller() {
  const overview = { context: jest.fn(async () => ({ locations: [] })) };
  const actor = jest.fn(async () => 'session-actor');
  return { overview, actor, controller: new OverviewController({ overview, actor } as unknown as PlatformRuntime & { overview: OperationalOverview }) };
}
test('controller derives the actor from the host session and rejects undeclared body scope', async () => {
  const h = controller();
  await h.controller.context(request, {});
  expect(h.overview.context).toHaveBeenCalledWith('session-actor');
  await expect(h.controller.context(request, { actor: 'foreign-actor' })).rejects.toMatchObject({ status: 400 });
  expect(h.overview.context).toHaveBeenCalledTimes(1);
});
test('controller maps denied and unavailable use cases without exposing internals', async () => {
  const h = controller();
  h.overview.context.mockRejectedValue(new OverviewError('overview_denied'));
  await expect(h.controller.context(request, {})).rejects.toMatchObject({ status: 403 });
  h.overview.context.mockRejectedValue(new OverviewError('overview_unavailable'));
  await expect(h.controller.context(request, {})).rejects.toMatchObject({ status: 503 });
});
test('controller rejects uncomposed runtime and URL selectors', async () => {
  await expect(new OverviewController(null).context(request, {})).rejects.toMatchObject({ status: 503 });
  const h = controller();
  await expect(h.controller.context({ url: '/api/v1/overview/context?site=other' } as IncomingMessage, {})).rejects.toMatchObject({ status: 400 });
  expect(h.actor).not.toHaveBeenCalled();
});
