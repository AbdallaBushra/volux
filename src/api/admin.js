import { apiRequest } from "./client";

export const createTrainingOpportunity = (payload) =>
  apiRequest("/v1/admin/opportunities/training", {
    method: "POST",
    body: payload,
  });

export const updateAdminOpportunity = (id, payload) =>
  apiRequest(`/v1/admin/opportunities/${id}`, {
    method: "PATCH",
    body: payload,
  });

export const publishAdminOpportunity = (id) =>
  apiRequest(`/v1/admin/opportunities/${id}/publish`, {
    method: "POST",
    body: {},
  });

export const archiveAdminOpportunity = (id) =>
  apiRequest(`/v1/admin/opportunities/${id}/archive`, {
    method: "POST",
    body: {},
  });

export const approveAdminOpportunity = (id) =>
  apiRequest(`/v1/admin/opportunities/${id}/approve`, {
    method: "POST",
    body: {},
  });

export const rejectAdminOpportunity = (id, reason) =>
  apiRequest(`/v1/admin/opportunities/${id}/reject`, {
    method: "POST",
    body: { reason },
  });

export const deleteAdminOpportunity = (id) =>
  apiRequest(`/v1/admin/opportunities/${id}`, {
    method: "DELETE",
  });

export const approveRegistrationByAdmin = (userId) =>
  apiRequest(`/v1/admin/registrations/${userId}/approve`, {
    method: "POST",
    body: {},
  });

export const rejectRegistrationByAdmin = (userId, reason) =>
  apiRequest(`/v1/admin/registrations/${userId}/reject`, {
    method: "POST",
    body: { reason },
  });

export const updateAdminUserStatus = (userId, status) =>
  apiRequest(`/v1/admin/users/${userId}/status`, {
    method: "PATCH",
    body: { status },
  });

export const getAdminStatsApi = () =>
  apiRequest("/v1/admin/stats", {
    method: "GET",
  });

export const healthCheckApi = () =>
  apiRequest("/v1/health", {
    method: "GET",
    authRequired: false,
  });
