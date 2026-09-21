import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { features } from "../../src/core/registry";
import { useTheme } from "../../src/core/theme";

const MAX_VISIBLE_TABS = 4;

export default function TabsLayout() {
  const { theme } = useTheme();

  const routable = features.filter((f) => f.id !== "auth");
  const visible = routable.filter((f) => f.enabled && f.showInTabBar).slice(0, MAX_VISIBLE_TABS);
  const visibleIds = new Set(visible.map((f) => f.id));
  const hidden = routable.filter((f) => !visibleIds.has(f.id));

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border },
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
      }}
    >
      {visible.map((feature) => (
        <Tabs.Screen
          key={feature.id}
          name={feature.id}
          options={{
            title: feature.title,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={feature.icon as never} size={size} color={color} />
            ),
          }}
        />
      ))}

      {hidden.map((feature) => (
        // Routable (so "More" can link to it) but not shown as its own tab.
        <Tabs.Screen key={feature.id} name={feature.id} options={{ href: null, title: feature.title }} />
      ))}

      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size }) => <Ionicons name="ellipsis-horizontal" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
