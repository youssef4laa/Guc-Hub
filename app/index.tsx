import { Redirect } from "expo-router";

/**
 * Expo Router needs something to match "/" itself. Always bounce to /login;
 * the root layout's useProtectedRoute then bounces straight on to the tabs if
 * a session already exists, so this never causes a visible flash for a
 * signed-in user.
 */
export default function Index() {
  return <Redirect href="/login" />;
}
