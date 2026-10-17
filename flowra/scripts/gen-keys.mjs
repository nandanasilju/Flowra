// Prints fresh secrets for your .env file.
import { randomBytes } from "node:crypto";
console.log(`AUTH_SECRET="${randomBytes(32).toString("hex")}"`);
console.log(`ENCRYPTION_KEY="${randomBytes(32).toString("base64")}"`);
