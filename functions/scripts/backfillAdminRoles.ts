import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

const run = async () => {
  const snapshot = await db.collection("Users").where("role", "==", "admin").get();
  let updated = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (!data.adminRole) {
      await docSnap.ref.update({
        adminRole: "super_admin",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      updated += 1;
    }
  }

  console.log(`Admins scanned: ${snapshot.size}`);
  console.log(`Admins updated with adminRole=super_admin: ${updated}`);
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exit(1);
  });
