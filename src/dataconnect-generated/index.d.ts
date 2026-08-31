import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface ApplyToOpportunityData {
  volunteerApplication_insert: VolunteerApplication_Key;
}

export interface ApplyToOpportunityVariables {
  opportunityId: UUIDString;
  userId: UUIDString;
  applicationDate: TimestampString;
  status: string;
}

export interface CreateOpportunityData {
  opportunity_insert: Opportunity_Key;
}

export interface CreateOpportunityVariables {
  organizationId: UUIDString;
  description: string;
  endTime: TimestampString;
  location: string;
  startTime: TimestampString;
  status: string;
  title: string;
}

export interface ListApplicationsForUserData {
  volunteerApplications: ({
    id: UUIDString;
    opportunity: {
      title: string;
      description: string;
      location: string;
      startTime: TimestampString;
      endTime: TimestampString;
    };
      applicationDate: TimestampString;
      status: string;
  } & VolunteerApplication_Key)[];
}

export interface ListApplicationsForUserVariables {
  userId: UUIDString;
}

export interface ListOpportunitiesData {
  opportunities: ({
    id: UUIDString;
    title: string;
    description: string;
    location: string;
    startTime: TimestampString;
    endTime: TimestampString;
    status: string;
    organization: {
      name: string;
    };
  } & Opportunity_Key)[];
}

export interface Opportunity_Key {
  id: UUIDString;
  __typename?: 'Opportunity_Key';
}

export interface Organization_Key {
  id: UUIDString;
  __typename?: 'Organization_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

export interface VolunteerApplication_Key {
  id: UUIDString;
  __typename?: 'VolunteerApplication_Key';
}

export interface VolunteerShift_Key {
  id: UUIDString;
  __typename?: 'VolunteerShift_Key';
}

interface CreateOpportunityRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateOpportunityVariables): MutationRef<CreateOpportunityData, CreateOpportunityVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateOpportunityVariables): MutationRef<CreateOpportunityData, CreateOpportunityVariables>;
  operationName: string;
}
export const createOpportunityRef: CreateOpportunityRef;

export function createOpportunity(vars: CreateOpportunityVariables): MutationPromise<CreateOpportunityData, CreateOpportunityVariables>;
export function createOpportunity(dc: DataConnect, vars: CreateOpportunityVariables): MutationPromise<CreateOpportunityData, CreateOpportunityVariables>;

interface ListOpportunitiesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListOpportunitiesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListOpportunitiesData, undefined>;
  operationName: string;
}
export const listOpportunitiesRef: ListOpportunitiesRef;

export function listOpportunities(): QueryPromise<ListOpportunitiesData, undefined>;
export function listOpportunities(dc: DataConnect): QueryPromise<ListOpportunitiesData, undefined>;

interface ApplyToOpportunityRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ApplyToOpportunityVariables): MutationRef<ApplyToOpportunityData, ApplyToOpportunityVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ApplyToOpportunityVariables): MutationRef<ApplyToOpportunityData, ApplyToOpportunityVariables>;
  operationName: string;
}
export const applyToOpportunityRef: ApplyToOpportunityRef;

export function applyToOpportunity(vars: ApplyToOpportunityVariables): MutationPromise<ApplyToOpportunityData, ApplyToOpportunityVariables>;
export function applyToOpportunity(dc: DataConnect, vars: ApplyToOpportunityVariables): MutationPromise<ApplyToOpportunityData, ApplyToOpportunityVariables>;

interface ListApplicationsForUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListApplicationsForUserVariables): QueryRef<ListApplicationsForUserData, ListApplicationsForUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListApplicationsForUserVariables): QueryRef<ListApplicationsForUserData, ListApplicationsForUserVariables>;
  operationName: string;
}
export const listApplicationsForUserRef: ListApplicationsForUserRef;

export function listApplicationsForUser(vars: ListApplicationsForUserVariables): QueryPromise<ListApplicationsForUserData, ListApplicationsForUserVariables>;
export function listApplicationsForUser(dc: DataConnect, vars: ListApplicationsForUserVariables): QueryPromise<ListApplicationsForUserData, ListApplicationsForUserVariables>;

