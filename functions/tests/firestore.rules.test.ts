import * as path from "path";
import * as fs from "fs/promises";
import assert from "node:assert/strict";
import {before, after, test} from "node:test";
import {
  type RulesTestEnvironment,
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from "@firebase/rules-unit-testing";
import {doc, getDoc, setDoc} from "firebase/firestore";

let testEnv: RulesTestEnvironment;

before(async () => {
  const rulesPath = path.resolve(__dirname, "..", "..", "firestore.rules");
  const rules = await fs.readFile(rulesPath, "utf8");

  testEnv = await initializeTestEnvironment({
    projectId: "volux-rules-test",
    firestore: {
      host: "127.0.0.1",
      port: 8080,
      rules,
    },
  });
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

const resetData = async () => {
  await testEnv.clearFirestore();
};

test("unauthenticated user cannot read private user profile", async () => {
  await resetData();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "Users", "u_private"), {
      role: "volunteer",
      status: "active",
    });
  });

  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, "Users", "u_private")));
});

test("public active opportunity can be read without auth", async () => {
  await resetData();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "Opportunities", "opp_public"), {
      status: "active",
      statusWorkflow: "active",
      createdBy: "owner1",
    });
  });

  const db = testEnv.unauthenticatedContext().firestore();
  const snapshot = await assertSucceeds(getDoc(doc(db, "Opportunities", "opp_public")));
  assert.equal(snapshot.exists(), true);
});

test("unauthenticated user cannot create opportunity", async () => {
  await resetData();
  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(setDoc(doc(db, "Opportunities", "opp_denied"), {
    title: "Denied",
    createdBy: "anon",
    status: "pending",
  }));
});

test("authenticated user can create own non-admin user document", async () => {
  await resetData();
  const db = testEnv.authenticatedContext("user_1").firestore();
  await assertSucceeds(setDoc(doc(db, "Users", "user_1"), {
    role: "volunteer",
    status: "active",
  }));
});

test("non-admin cannot write SystemConfig", async () => {
  await resetData();
  const db = testEnv.authenticatedContext("vol_1").firestore();
  await assertFails(setDoc(doc(db, "SystemConfig", "adminSettings"), {
    platformName: "Volux",
  }));
});

test("super admin can write SystemConfig", async () => {
  await resetData();
  const db = testEnv.authenticatedContext("admin_1", {
    role: "admin",
    adminRole: "super_admin",
  }).firestore();

  await assertSucceeds(setDoc(doc(db, "SystemConfig", "adminSettings"), {
    platformName: "Volux Global",
  }));
});
