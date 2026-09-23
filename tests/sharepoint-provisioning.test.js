import test from 'node:test';
import assert from 'node:assert/strict';
import { createProvisioningPlan } from '../src/stores/sharepoint-provisioning.js';

test('provisioning plan is deterministic and includes indexes after fields', () => {
  const plan = createProvisioningPlan({ lists: [{ title: 'Fixtures', fields: ['LeagueId', 'MatchWeek'], indexed: ['LeagueId', 'MatchWeek'] }] });
  assert.deepEqual(plan, [
    { operation: 'create-list', title: 'Fixtures' },
    { operation: 'ensure-field', list: 'Fixtures', field: 'LeagueId' },
    { operation: 'ensure-field', list: 'Fixtures', field: 'MatchWeek' },
    { operation: 'ensure-index', list: 'Fixtures', field: 'LeagueId' },
    { operation: 'ensure-index', list: 'Fixtures', field: 'MatchWeek' }
  ]);
});
