import { act, render } from "@testing-library/react-native";
import { Text } from "react-native";

import type { LoginStrategy } from "../LoginStrategy";

// A "real" strategy that must never be used for demo mode.
const mockRealLogin = jest.fn();
jest.mock("../selectLoginStrategy", () => ({
  selectLoginStrategy: (): LoginStrategy => ({
    id: "ntlm",
    login: mockRealLogin,
    isSessionValid: async () => true,
  }),
}));
jest.mock("../demoMode", () => ({
  isDemoMode: jest.fn(async () => false),
  setDemoMode: jest.fn(async () => {}),
}));
jest.mock("../../storage/secureStore", () => ({
  hasStoredCredentials: jest.fn(async () => false),
  loadCredentials: jest.fn(async () => null),
  saveCredentials: jest.fn(async () => {}),
  deleteCredentials: jest.fn(async () => {}),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports -- import after mocks
const { AuthProvider, useAuth } = require("../AuthProvider");

describe("AuthProvider demo mode", () => {
  it("never sends the demo credentials to the configured real strategy", async () => {
    let auth: ReturnType<typeof useAuth> | undefined;
    function Probe() {
      auth = useAuth();
      return <Text>{String(auth?.isAuthenticated)}</Text>;
    }
    const screen = await render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await act(async () => {
      await auth!.loginWithDemo();
    });
    expect(mockRealLogin).not.toHaveBeenCalled();
    expect(screen.getByText("true")).toBeTruthy();
  });
});
