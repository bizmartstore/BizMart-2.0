import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

const serviceAccount = {
  type: "service_account",
  project_id: "bizmart-aaf1b",
  client_email: "firebase-adminsdk-$(PROJECT_ID)@bizmart-aaf1b.iam.gserviceaccount.com",
  private_key: "-----BEGIN PRIVATE KEY-----\n$(PRIVATE_KEY_CONTENT)\n-----END PRIVATE KEY-----",
  client_id: "firebase-adminsdk-$(PROJECT_ID)",
  auth_uri: "https://securetoken.googleapis.com/v1",
  token_uri: "https://oauth2.googleapis.com/token",
  project_id: "bizmart-aaf1b",
};

const adminApp = initializeApp({
  credential: cert(serviceAccount),
});
export const messaging = getMessaging(adminApp);