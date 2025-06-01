import { View, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";
import {
  DATABASE_ID,
  HABITS_COLLECTION_ID,
  COMPLETIONS_COLLECTION_ID,
  databases,
  client,
  RealtimeResponse,
} from "@/lib/appwrite";
import { Habit, HabitCompletion } from "@/types/database.type";
import { Query } from "react-native-appwrite";
import { useAuth } from "@/lib/auth-context";
import { Card, Text } from "react-native-paper";
import { ScrollView } from "react-native-gesture-handler";

export default function StreakScreen() {
  const [habits, setHabits] = useState<Habit[]>();
  const [completedHabits, setCompletedHabits] = useState<HabitCompletion[]>();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channelHabits = `databases.${DATABASE_ID}.collections.${HABITS_COLLECTION_ID}.documents`;
    const subscribeHabits = client.subscribe(
      channelHabits,
      (response: RealtimeResponse) => {
        if (
          response.events.includes(
            "databases.*.collections.*.documents.*.create"
          ) ||
          response.events.includes(
            "databases.*.collections.*.documents.*.update"
          ) ||
          response.events.includes(
            "databases.*.collections.*.documents.*.delete"
          )
        ) {
          fetchHabits();
        }
      }
    );

     const channelCompletions = `databases.${DATABASE_ID}.collections.${COMPLETIONS_COLLECTION_ID}.documents`;
    const subscribeCompletions = client.subscribe(
      channelCompletions,
      (response: RealtimeResponse) => {
        if (
          response.events.includes(
            "databases.*.collections.*.documents.*.create"
          )
        ) {
          fetchCompletions();
        }
      }
    );


    fetchHabits();
    fetchCompletions();

    return () => {
      subscribeHabits();
      subscribeCompletions();
    };
  }, [user]);

  const fetchHabits = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        HABITS_COLLECTION_ID,
        [Query.equal("user_id", user?.$id || "")]
      );

      setHabits(response.documents as Habit[]);
    } catch (error) {
      console.error("Error fetching habits:", error);
    }
  };

  const fetchCompletions = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        [Query.equal("user_id", user?.$id ?? "")]
      );

      const completions = response.documents as HabitCompletion[];
      setCompletedHabits(completions);
    } catch (error) {
      console.error("Error fetching habits:", error);
    }
  };

  interface StreakData {
    streak: number;
    bestStreak: number;
    totalStreak: number;
  }

  const getStreakData = (habitId: string) => {
    const habitCompletions = completedHabits
      ?.filter((c) => c.habit_id === habitId)
      .sort(
        (a, b) =>
          new Date(b.completed_at).getTime() -
          new Date(a.completed_at).getTime()
      );

    if (!habitCompletions || habitCompletions.length === 0) {
      return { streak: 0, bestStreak: 0, totalStreak: 0 };
    }

    // Calculate streaks
    let streak = 0;
    let bestStreak = 0;
    let totalStreak = habitCompletions.length;
    let currentStreak = 0;
    let lastDate: Date | null = null;

    habitCompletions.forEach((c) => {
      const date = new Date(c.completed_at);

      if (lastDate) {
        const diffTime =
          date.getTime() - lastDate.getTime() / (1000 * 60 * 60 * 24);

        if (diffTime <= 1.5) {
          currentStreak += 1;
        } else {
          currentStreak = 1; // Reset streak
        }
      } else {
        if (currentStreak > bestStreak) bestStreak = currentStreak;
        streak = currentStreak;
        lastDate = date;
      }
    });

    return { streak, bestStreak, totalStreak };
  };

  const habitStreaks = habits?.map((habit) => {
    const { streak, bestStreak, totalStreak } = getStreakData(habit.$id);
    return { habit, streak, bestStreak, totalStreak };
  });

  const rankedHabits = habitStreaks?.sort(
    (a, b) => a.bestStreak - b.bestStreak
  );
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Habits Streak</Text>
      {habits?.length === 0 ? (
        <View>
          <Text>No Habits yet. Add Habit</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
        {rankedHabits?.map(({ habit, streak, totalStreak, bestStreak }, idx) => (
          <Card key={habit.$id}
              style={[styles.card, idx === 0 && styles.firstCard]}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.habitTitle}>{habit.title}</Text>
              <Text style={styles.habitDescription}>{habit.description}</Text>

              <View style={styles.statsRow}>
                <View style={styles.streakBadge}>
                  <Text style={styles.statsText}>🔥{streak}</Text>
                  <Text style={styles.statsLabel}>Current</Text>
                </View>

                <View style={styles.streakBest}>
                  <Text style={styles.statsText}>🏆{bestStreak}</Text>
                  <Text style={styles.statsLabel}>Best</Text>
                </View>

                <View style={styles.streakTotal}>
                  <Text style={styles.statsText}>✅{totalStreak}</Text>
                  <Text style={styles.statsLabel}>Total</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 16,
  },
  card: {
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  firstCard: {
    borderColor: "#7c4dff",
    borderWidth: 2,
  },
  habitTitle: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 14,
    color: "#6c6c80",
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    marginTop: 8,
  },
  streakBadge: {
    backgroundColor: "#fff3e0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: "center",
    minWidth: 70,
  },
  streakBest: {
    backgroundColor: "#fffde7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: "center",
    minWidth: 70,
  },
  streakTotal: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: "center",
    minWidth: 70,
  },
  statsText: {
    color: "#22223b",
    fontSize: 16,
    fontWeight: "bold",
  },
  statsLabel: {
    fontSize: 12,
    color: "#888",
  },
});
