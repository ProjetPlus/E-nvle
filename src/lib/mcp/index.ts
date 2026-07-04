import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listConversations from "./tools/list-conversations";
import listMessages from "./tools/list-messages";
import sendMessage from "./tools/send-message";
import getProfile from "./tools/get-profile";
import listTransactions from "./tools/list-transactions";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "envle-mcp",
  title: "E'nvlé One MCP",
  version: "0.1.0",
  instructions:
    "Tools for the E'nvlé One super app. Read the signed-in user's profile, conversations, messages, and wallet transactions, and send new chat messages on their behalf.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getProfile, listConversations, listMessages, sendMessage, listTransactions],
});
