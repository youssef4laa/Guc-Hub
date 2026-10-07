import { useState } from "react";
import { Linking, Pressable, ScrollView, TextInput, View } from "react-native";

import { useTheme } from "../../../core/theme";
import { Button, Card, EmptyState, QueryGate, Text } from "../../../core/ui";
import { searchStaff, useStaffItems } from "../store";

export function StaffScreen() {
  const query = useStaffItems();
  const { theme } = useTheme();
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <QueryGate query={query} emptyTitle="No staff listed" emptyMessage="Nothing to show in demo mode.">
      {(staff) => {
        const results = searchStaff(staff, search);
        return (
          <View style={{ flex: 1 }}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search name, department or course"
              placeholderTextColor={theme.colors.textMuted}
              accessibilityLabel="Search staff"
              autoCorrect={false}
              style={{
                borderWidth: 1,
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                borderRadius: theme.radii.md,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.md,
                marginBottom: theme.spacing.lg,
                fontSize: 16,
              }}
            />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {results.length === 0 ? (
                <EmptyState title="No matches" message={`Nobody matches "${search}".`} />
              ) : null}
              {results.map((person) => {
                const open = openId === person.id;
                return (
                  <Pressable
                    key={person.id}
                    onPress={() => setOpenId(open ? null : person.id)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: open }}
                    accessibilityLabel={`${person.name}, ${person.title}`}
                  >
                    <Card style={{ marginBottom: theme.spacing.sm }}>
                      <Text style={{ fontWeight: "600" }}>{person.name}</Text>
                      <Text variant="caption" color="muted">
                        {person.title} · {person.department}
                      </Text>
                      {open ? (
                        <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.xs }}>
                          <Text variant="caption">Office: {person.office}</Text>
                          <Text variant="caption">Office hours: {person.officeHours}</Text>
                          <Text variant="caption">Courses: {person.courses.join(", ")}</Text>
                          <Text variant="caption" color="primary">
                            {person.email}
                          </Text>
                          <View style={{ marginTop: theme.spacing.sm }}>
                            <Button
                              label="Email"
                              variant="secondary"
                              onPress={() => void Linking.openURL(`mailto:${person.email}`)}
                            />
                          </View>
                        </View>
                      ) : null}
                    </Card>
                  </Pressable>
                );
              })}
              <Text
                color="muted"
                variant="caption"
                style={{ textAlign: "center", marginTop: theme.spacing.md }}
              >
                Demo data — invented people and addresses.
              </Text>
            </ScrollView>
          </View>
        );
      }}
    </QueryGate>
  );
}
