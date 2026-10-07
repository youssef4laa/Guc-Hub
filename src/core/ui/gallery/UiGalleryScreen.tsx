import { ScrollView, View } from "react-native";

import { PortalError } from "../../portal/PortalError";
import { useTheme } from "../../theme";
import { Button } from "../Button";
import { Card } from "../Card";
import { EmptyState } from "../EmptyState";
import { ErrorState } from "../ErrorState";
import { Screen } from "../Screen";
import { Skeleton } from "../Skeleton";
import { Text } from "../Text";

/**
 * Dev-build-only showcase of every core/ui primitive, in the current theme. Toggle
 * light/dark from Settings and revisit this screen rather than screenshotting each
 * component ad hoc — this is what a PR's "screenshots" checkbox should be checked
 * against.
 */
export function UiGalleryScreen() {
  const { theme, themeName } = useTheme();

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: theme.spacing.lg, paddingBottom: theme.spacing.xl }}>
        <Text variant="title">UI gallery ({themeName})</Text>

        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="heading">Text</Text>
          <Text variant="title">Title</Text>
          <Text variant="heading">Heading</Text>
          <Text variant="body">Body</Text>
          <Text variant="caption" color="muted">
            Caption, muted
          </Text>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="heading">Buttons</Text>
          <Button label="Primary" onPress={() => {}} />
          <Button label="Secondary" variant="secondary" onPress={() => {}} />
          <Button label="Ghost" variant="ghost" onPress={() => {}} />
          <Button label="Loading" loading onPress={() => {}} />
          <Button label="Disabled" disabled onPress={() => {}} />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="heading">Card</Text>
          <Card>
            <Text>Card content</Text>
          </Card>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="heading">Skeleton</Text>
          <Skeleton style={{ height: 20 }} />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="heading">Empty state</Text>
          <EmptyState title="Nothing here" message="Empty-state message goes here." />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="heading">Error state</Text>
          <ErrorState error={new Error("Example error message")} onRetry={() => {}} />
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Text variant="heading">Error state (PARSE_FAILED)</Text>
          <ErrorState
            error={
              new PortalError("PARSE_FAILED", "Example parse failure", {
                sourceUrl: "https://example.invalid/original-page",
              })
            }
            onRetry={() => {}}
            onOpenOriginal={() => {}}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}
