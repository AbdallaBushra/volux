# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*ListOpportunities*](#listopportunities)
  - [*ListApplicationsForUser*](#listapplicationsforuser)
- [**Mutations**](#mutations)
  - [*CreateOpportunity*](#createopportunity)
  - [*ApplyToOpportunity*](#applytoopportunity)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## ListOpportunities
You can execute the `ListOpportunities` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listOpportunities(): QueryPromise<ListOpportunitiesData, undefined>;

interface ListOpportunitiesRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListOpportunitiesData, undefined>;
}
export const listOpportunitiesRef: ListOpportunitiesRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listOpportunities(dc: DataConnect): QueryPromise<ListOpportunitiesData, undefined>;

interface ListOpportunitiesRef {
  ...
  (dc: DataConnect): QueryRef<ListOpportunitiesData, undefined>;
}
export const listOpportunitiesRef: ListOpportunitiesRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listOpportunitiesRef:
```typescript
const name = listOpportunitiesRef.operationName;
console.log(name);
```

### Variables
The `ListOpportunities` query has no variables.
### Return Type
Recall that executing the `ListOpportunities` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListOpportunitiesData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListOpportunities`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listOpportunities } from '@dataconnect/generated';


// Call the `listOpportunities()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listOpportunities();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listOpportunities(dataConnect);

console.log(data.opportunities);

// Or, you can use the `Promise` API.
listOpportunities().then((response) => {
  const data = response.data;
  console.log(data.opportunities);
});
```

### Using `ListOpportunities`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listOpportunitiesRef } from '@dataconnect/generated';


// Call the `listOpportunitiesRef()` function to get a reference to the query.
const ref = listOpportunitiesRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listOpportunitiesRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.opportunities);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.opportunities);
});
```

## ListApplicationsForUser
You can execute the `ListApplicationsForUser` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listApplicationsForUser(vars: ListApplicationsForUserVariables): QueryPromise<ListApplicationsForUserData, ListApplicationsForUserVariables>;

interface ListApplicationsForUserRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListApplicationsForUserVariables): QueryRef<ListApplicationsForUserData, ListApplicationsForUserVariables>;
}
export const listApplicationsForUserRef: ListApplicationsForUserRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listApplicationsForUser(dc: DataConnect, vars: ListApplicationsForUserVariables): QueryPromise<ListApplicationsForUserData, ListApplicationsForUserVariables>;

interface ListApplicationsForUserRef {
  ...
  (dc: DataConnect, vars: ListApplicationsForUserVariables): QueryRef<ListApplicationsForUserData, ListApplicationsForUserVariables>;
}
export const listApplicationsForUserRef: ListApplicationsForUserRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listApplicationsForUserRef:
```typescript
const name = listApplicationsForUserRef.operationName;
console.log(name);
```

### Variables
The `ListApplicationsForUser` query requires an argument of type `ListApplicationsForUserVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ListApplicationsForUserVariables {
  userId: UUIDString;
}
```
### Return Type
Recall that executing the `ListApplicationsForUser` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListApplicationsForUserData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `ListApplicationsForUser`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listApplicationsForUser, ListApplicationsForUserVariables } from '@dataconnect/generated';

// The `ListApplicationsForUser` query requires an argument of type `ListApplicationsForUserVariables`:
const listApplicationsForUserVars: ListApplicationsForUserVariables = {
  userId: ..., 
};

// Call the `listApplicationsForUser()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listApplicationsForUser(listApplicationsForUserVars);
// Variables can be defined inline as well.
const { data } = await listApplicationsForUser({ userId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listApplicationsForUser(dataConnect, listApplicationsForUserVars);

console.log(data.volunteerApplications);

// Or, you can use the `Promise` API.
listApplicationsForUser(listApplicationsForUserVars).then((response) => {
  const data = response.data;
  console.log(data.volunteerApplications);
});
```

### Using `ListApplicationsForUser`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listApplicationsForUserRef, ListApplicationsForUserVariables } from '@dataconnect/generated';

// The `ListApplicationsForUser` query requires an argument of type `ListApplicationsForUserVariables`:
const listApplicationsForUserVars: ListApplicationsForUserVariables = {
  userId: ..., 
};

// Call the `listApplicationsForUserRef()` function to get a reference to the query.
const ref = listApplicationsForUserRef(listApplicationsForUserVars);
// Variables can be defined inline as well.
const ref = listApplicationsForUserRef({ userId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listApplicationsForUserRef(dataConnect, listApplicationsForUserVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.volunteerApplications);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.volunteerApplications);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateOpportunity
You can execute the `CreateOpportunity` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createOpportunity(vars: CreateOpportunityVariables): MutationPromise<CreateOpportunityData, CreateOpportunityVariables>;

interface CreateOpportunityRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateOpportunityVariables): MutationRef<CreateOpportunityData, CreateOpportunityVariables>;
}
export const createOpportunityRef: CreateOpportunityRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createOpportunity(dc: DataConnect, vars: CreateOpportunityVariables): MutationPromise<CreateOpportunityData, CreateOpportunityVariables>;

interface CreateOpportunityRef {
  ...
  (dc: DataConnect, vars: CreateOpportunityVariables): MutationRef<CreateOpportunityData, CreateOpportunityVariables>;
}
export const createOpportunityRef: CreateOpportunityRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createOpportunityRef:
```typescript
const name = createOpportunityRef.operationName;
console.log(name);
```

### Variables
The `CreateOpportunity` mutation requires an argument of type `CreateOpportunityVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateOpportunityVariables {
  organizationId: UUIDString;
  description: string;
  endTime: TimestampString;
  location: string;
  startTime: TimestampString;
  status: string;
  title: string;
}
```
### Return Type
Recall that executing the `CreateOpportunity` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateOpportunityData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateOpportunityData {
  opportunity_insert: Opportunity_Key;
}
```
### Using `CreateOpportunity`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createOpportunity, CreateOpportunityVariables } from '@dataconnect/generated';

// The `CreateOpportunity` mutation requires an argument of type `CreateOpportunityVariables`:
const createOpportunityVars: CreateOpportunityVariables = {
  organizationId: ..., 
  description: ..., 
  endTime: ..., 
  location: ..., 
  startTime: ..., 
  status: ..., 
  title: ..., 
};

// Call the `createOpportunity()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createOpportunity(createOpportunityVars);
// Variables can be defined inline as well.
const { data } = await createOpportunity({ organizationId: ..., description: ..., endTime: ..., location: ..., startTime: ..., status: ..., title: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createOpportunity(dataConnect, createOpportunityVars);

console.log(data.opportunity_insert);

// Or, you can use the `Promise` API.
createOpportunity(createOpportunityVars).then((response) => {
  const data = response.data;
  console.log(data.opportunity_insert);
});
```

### Using `CreateOpportunity`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createOpportunityRef, CreateOpportunityVariables } from '@dataconnect/generated';

// The `CreateOpportunity` mutation requires an argument of type `CreateOpportunityVariables`:
const createOpportunityVars: CreateOpportunityVariables = {
  organizationId: ..., 
  description: ..., 
  endTime: ..., 
  location: ..., 
  startTime: ..., 
  status: ..., 
  title: ..., 
};

// Call the `createOpportunityRef()` function to get a reference to the mutation.
const ref = createOpportunityRef(createOpportunityVars);
// Variables can be defined inline as well.
const ref = createOpportunityRef({ organizationId: ..., description: ..., endTime: ..., location: ..., startTime: ..., status: ..., title: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createOpportunityRef(dataConnect, createOpportunityVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.opportunity_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.opportunity_insert);
});
```

## ApplyToOpportunity
You can execute the `ApplyToOpportunity` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
applyToOpportunity(vars: ApplyToOpportunityVariables): MutationPromise<ApplyToOpportunityData, ApplyToOpportunityVariables>;

interface ApplyToOpportunityRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: ApplyToOpportunityVariables): MutationRef<ApplyToOpportunityData, ApplyToOpportunityVariables>;
}
export const applyToOpportunityRef: ApplyToOpportunityRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
applyToOpportunity(dc: DataConnect, vars: ApplyToOpportunityVariables): MutationPromise<ApplyToOpportunityData, ApplyToOpportunityVariables>;

interface ApplyToOpportunityRef {
  ...
  (dc: DataConnect, vars: ApplyToOpportunityVariables): MutationRef<ApplyToOpportunityData, ApplyToOpportunityVariables>;
}
export const applyToOpportunityRef: ApplyToOpportunityRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the applyToOpportunityRef:
```typescript
const name = applyToOpportunityRef.operationName;
console.log(name);
```

### Variables
The `ApplyToOpportunity` mutation requires an argument of type `ApplyToOpportunityVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface ApplyToOpportunityVariables {
  opportunityId: UUIDString;
  userId: UUIDString;
  applicationDate: TimestampString;
  status: string;
}
```
### Return Type
Recall that executing the `ApplyToOpportunity` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ApplyToOpportunityData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ApplyToOpportunityData {
  volunteerApplication_insert: VolunteerApplication_Key;
}
```
### Using `ApplyToOpportunity`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, applyToOpportunity, ApplyToOpportunityVariables } from '@dataconnect/generated';

// The `ApplyToOpportunity` mutation requires an argument of type `ApplyToOpportunityVariables`:
const applyToOpportunityVars: ApplyToOpportunityVariables = {
  opportunityId: ..., 
  userId: ..., 
  applicationDate: ..., 
  status: ..., 
};

// Call the `applyToOpportunity()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await applyToOpportunity(applyToOpportunityVars);
// Variables can be defined inline as well.
const { data } = await applyToOpportunity({ opportunityId: ..., userId: ..., applicationDate: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await applyToOpportunity(dataConnect, applyToOpportunityVars);

console.log(data.volunteerApplication_insert);

// Or, you can use the `Promise` API.
applyToOpportunity(applyToOpportunityVars).then((response) => {
  const data = response.data;
  console.log(data.volunteerApplication_insert);
});
```

### Using `ApplyToOpportunity`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, applyToOpportunityRef, ApplyToOpportunityVariables } from '@dataconnect/generated';

// The `ApplyToOpportunity` mutation requires an argument of type `ApplyToOpportunityVariables`:
const applyToOpportunityVars: ApplyToOpportunityVariables = {
  opportunityId: ..., 
  userId: ..., 
  applicationDate: ..., 
  status: ..., 
};

// Call the `applyToOpportunityRef()` function to get a reference to the mutation.
const ref = applyToOpportunityRef(applyToOpportunityVars);
// Variables can be defined inline as well.
const ref = applyToOpportunityRef({ opportunityId: ..., userId: ..., applicationDate: ..., status: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = applyToOpportunityRef(dataConnect, applyToOpportunityVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.volunteerApplication_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.volunteerApplication_insert);
});
```

