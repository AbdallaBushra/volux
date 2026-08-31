const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'volux',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const createOpportunityRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateOpportunity', inputVars);
}
createOpportunityRef.operationName = 'CreateOpportunity';
exports.createOpportunityRef = createOpportunityRef;

exports.createOpportunity = function createOpportunity(dcOrVars, vars) {
  return executeMutation(createOpportunityRef(dcOrVars, vars));
};

const listOpportunitiesRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListOpportunities');
}
listOpportunitiesRef.operationName = 'ListOpportunities';
exports.listOpportunitiesRef = listOpportunitiesRef;

exports.listOpportunities = function listOpportunities(dc) {
  return executeQuery(listOpportunitiesRef(dc));
};

const applyToOpportunityRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'ApplyToOpportunity', inputVars);
}
applyToOpportunityRef.operationName = 'ApplyToOpportunity';
exports.applyToOpportunityRef = applyToOpportunityRef;

exports.applyToOpportunity = function applyToOpportunity(dcOrVars, vars) {
  return executeMutation(applyToOpportunityRef(dcOrVars, vars));
};

const listApplicationsForUserRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListApplicationsForUser', inputVars);
}
listApplicationsForUserRef.operationName = 'ListApplicationsForUser';
exports.listApplicationsForUserRef = listApplicationsForUserRef;

exports.listApplicationsForUser = function listApplicationsForUser(dcOrVars, vars) {
  return executeQuery(listApplicationsForUserRef(dcOrVars, vars));
};
