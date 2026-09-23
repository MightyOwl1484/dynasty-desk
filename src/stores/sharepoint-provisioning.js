/** Convert the checked schema into deterministic, reviewable provisioning steps. */
export function createProvisioningPlan(schema) {
  if (!schema?.lists?.length) throw new TypeError('A SharePoint schema with lists is required.');
  return schema.lists.flatMap((list) => [
    { operation: 'create-list', title: list.title },
    ...list.fields.map((field) => ({ operation: 'ensure-field', list: list.title, field })),
    ...(list.indexed ?? []).map((field) => ({ operation: 'ensure-index', list: list.title, field }))
  ]);
}
