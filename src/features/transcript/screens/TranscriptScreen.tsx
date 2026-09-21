import { FlatList } from "react-native";

import { EmptyState, ErrorState, Screen, Skeleton, Text } from "../../../core/ui";
import { useTranscriptItems } from "../store";

export function TranscriptScreen() {
  const { data, isPending, error, refetch } = useTranscriptItems();

  if (isPending) {
    return (
      <Screen>
        <Skeleton style={{ height: 24, marginBottom: 12 }} />
        <Skeleton style={{ height: 24, marginBottom: 12 }} />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState error={error} onRetry={() => refetch()} />
      </Screen>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Screen>
        <EmptyState title="Nothing here yet" />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text>{item.title}</Text>}
      />
    </Screen>
  );
}
