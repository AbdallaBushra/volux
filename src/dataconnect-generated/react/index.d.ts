import { CreateOpportunityData, CreateOpportunityVariables, ListOpportunitiesData, ApplyToOpportunityData, ApplyToOpportunityVariables, ListApplicationsForUserData, ListApplicationsForUserVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateOpportunity(options?: useDataConnectMutationOptions<CreateOpportunityData, FirebaseError, CreateOpportunityVariables>): UseDataConnectMutationResult<CreateOpportunityData, CreateOpportunityVariables>;
export function useCreateOpportunity(dc: DataConnect, options?: useDataConnectMutationOptions<CreateOpportunityData, FirebaseError, CreateOpportunityVariables>): UseDataConnectMutationResult<CreateOpportunityData, CreateOpportunityVariables>;

export function useListOpportunities(options?: useDataConnectQueryOptions<ListOpportunitiesData>): UseDataConnectQueryResult<ListOpportunitiesData, undefined>;
export function useListOpportunities(dc: DataConnect, options?: useDataConnectQueryOptions<ListOpportunitiesData>): UseDataConnectQueryResult<ListOpportunitiesData, undefined>;

export function useApplyToOpportunity(options?: useDataConnectMutationOptions<ApplyToOpportunityData, FirebaseError, ApplyToOpportunityVariables>): UseDataConnectMutationResult<ApplyToOpportunityData, ApplyToOpportunityVariables>;
export function useApplyToOpportunity(dc: DataConnect, options?: useDataConnectMutationOptions<ApplyToOpportunityData, FirebaseError, ApplyToOpportunityVariables>): UseDataConnectMutationResult<ApplyToOpportunityData, ApplyToOpportunityVariables>;

export function useListApplicationsForUser(vars: ListApplicationsForUserVariables, options?: useDataConnectQueryOptions<ListApplicationsForUserData>): UseDataConnectQueryResult<ListApplicationsForUserData, ListApplicationsForUserVariables>;
export function useListApplicationsForUser(dc: DataConnect, vars: ListApplicationsForUserVariables, options?: useDataConnectQueryOptions<ListApplicationsForUserData>): UseDataConnectQueryResult<ListApplicationsForUserData, ListApplicationsForUserVariables>;
