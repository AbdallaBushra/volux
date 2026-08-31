import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'volux',
  location: 'us-east4'
};

export const createOpportunityRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateOpportunity', inputVars);
}
createOpportunityRef.operationName = 'CreateOpportunity';

export function createOpportunity(dcOrVars, vars) {
  return executeMutation(createOpportunityRef(dcOrVars, vars));
}

export const listOpportunitiesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListOpportunities');
}
listOpportunitiesRef.operationName = 'ListOpportunities';

export function listOpportunities(dc) {
  return executeQuery(listOpportunitiesRef(dc));
}

export const applyToOpportunityRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ApplyToOpportunity', inputVars);
}
applyToOpportunityRef.operationName = 'ApplyToOpportunity';

export function applyToOpportunity(dcOrVars, vars) {
  return executeMutation(applyToOpportunityRef(dcOrVars, vars));
}

export const listApplicationsForUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListApplicationsForUser', inputVars);
}
listApplicationsForUserRef.operationName = 'ListApplicationsForUser';

export function listApplicationsForUser(dcOrVars, vars) {
  return executeQuery(listApplicationsForUserRef(dcOrVars, vars));
}

