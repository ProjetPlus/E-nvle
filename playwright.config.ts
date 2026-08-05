import { createLovableConfig } from "lovable-agent-playwright-config/config";
import path from "node:path";

export default createLovableConfig({
  globalSetup: path.join(__dirname, "tests/global-setup.ts"),
  use: {
    storageState: path.join(__dirname, "tests/.auth/state.json"),
    permissions: ["camera", "microphone", "notifications"],
    launchOptions: {
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
        "--autoplay-policy=no-user-gesture-required",
      ],
    },
  },
});
