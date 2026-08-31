import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {onRequest} from "firebase-functions/v2/https";
import {onDocumentWritten} from "firebase-functions/v2/firestore";
import {app} from "./api";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const normalizeAdminRole = (value: unknown): "super_admin" | "content_admin" | "reviewer" => {
  if (value === "super_admin" || value === "content_admin" || value === "reviewer") {
    return value;
  }
  return "reviewer";
};

const claimsAreEqual = (
  left: Record<string, unknown>,
  right: Record<string, unknown>
): boolean => {
  return JSON.stringify(Object.keys(left).sort().reduce<Record<string, unknown>>((acc, key) => {
    acc[key] = left[key];
    return acc;
  }, {})) === JSON.stringify(Object.keys(right).sort().reduce<Record<string, unknown>>((acc, key) => {
    acc[key] = right[key];
    return acc;
  }, {}));
};

export const api = onRequest(
  {
    region: "us-central1",
    cors: true,
    maxInstances: 20,
  },
  app
);

export const syncUserClaims = onDocumentWritten(
  {
    document: "Users/{userId}",
    region: "us-central1",
  },
  async (event) => {
    const userId = event.params.userId;
    const afterSnapshot = event.data?.after;

    try {
      const userRecord = await admin.auth().getUser(userId);
      const currentClaims = (userRecord.customClaims || {}) as Record<string, unknown>;
      const nextClaims: Record<string, unknown> = {...currentClaims};

      if (!afterSnapshot?.exists) {
        delete nextClaims.role;
        delete nextClaims.adminRole;
      } else {
        const data = afterSnapshot.data();
        const isAdmin = data?.role === "admin";

        if (isAdmin) {
          nextClaims.role = "admin";
          nextClaims.adminRole = normalizeAdminRole(data?.adminRole);
        } else {
          delete nextClaims.role;
          delete nextClaims.adminRole;
        }
      }

      if (!claimsAreEqual(currentClaims, nextClaims)) {
        await admin.auth().setCustomUserClaims(userId, nextClaims);
        logger.info("Custom claims synced", {userId, claims: nextClaims});
      }
    } catch (error) {
      logger.error("Failed to sync custom claims", {userId, error});
    }
  }
);
