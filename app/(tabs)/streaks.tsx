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
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedHabits, setCompletedHabits] = useState<HabitCompletion[]>([]);
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
          ) ||
          response.events.includes(
            "databases.*.collections.*.documents.*.update"
          ) ||
          response.events.includes(
            "databases.*.collections.*.documents.*.delete"
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
        [Query.equal("user_id", user?.$id ?? "")]
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

  const getStreakData = (habitId: string): StreakData => {
    // Only keep one completion per day (by date string)
    const uniqueDates = Array.from(
      new Set(
        completedHabits
          .filter((c) => c.habit_id === habitId)
          .map((c) => new Date(c.completed_at).toDateString())
      )
    )
      .map((dateStr) => new Date(dateStr))
      .sort((a, b) => a.getTime() - b.getTime());

    if (!uniqueDates || uniqueDates.length === 0) {
      return { streak: 0, bestStreak: 0, totalStreak: 0 };
    }

    let streak = 0;
    let bestStreak = 0;
    let totalStreak = uniqueDates.length;
    let currentStreak = 1;
    let lastDate = uniqueDates[0];

    for (let i = 1; i < uniqueDates.length; i++) {
      const diffDays = Math.round(
        (uniqueDates[i].getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) {
        currentStreak++;
      } else if (diffDays > 1) {
        if (currentStreak > bestStreak) bestStreak = currentStreak;
        currentStreak = 1;
      }
      lastDate = uniqueDates[i];
    }
    if (currentStreak > bestStreak) bestStreak = currentStreak;

    // Check if last completion is today or yesterday for current streak
    const today = new Date();
    const lastCompletion = uniqueDates[uniqueDates.length - 1];
    const diffFromToday = Math.round(
      (today.setHours(0, 0, 0, 0) - lastCompletion.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    streak = diffFromToday <= 1 ? currentStreak : 0;

    return { streak, bestStreak, totalStreak };
  };

  const habitStreaks = habits.map((habit) => {
    const { streak, bestStreak, totalStreak } = getStreakData(habit.$id);
    return { habit, streak, bestStreak, totalStreak };
  });

  const rankedHabits = habitStreaks.sort((a, b) => b.bestStreak - a.bestStreak);

  const badgeStyles = [styles.badge1, styles.badge2, styles.badge3];
  return (
    <View style={styles.container}>
      <Text style={styles.title} variant="headlineSmall">
        Habits Streak
      </Text>

      {rankedHabits.length > 0 && (
        <View style={styles.rankingContainer}>
          <Text style={styles.rankingTitle}>🏅 Top Streaks</Text>
          {rankedHabits.slice(0, 3).map((item, key) => (
            <View key={key} style={styles.rankingRow}>
              <View style={[styles.rankingBadge, badgeStyles[key]]}>
                <Text style={styles.rankingBadgeText}> {key + 1} </Text>
              </View>
              <Text style={styles.rankingHabit}> {item.habit.title}</Text>
              <Text style={styles.rankingStreak}> {item.bestStreak}</Text>
            </View>
          ))}
        </View>
      )}

      {habits?.length === 0 ? (
        <View>
          <Text>No Habits yet. Add Habit</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {rankedHabits?.map(
            ({ habit, streak, totalStreak, bestStreak }, idx) => (
              <Card
                key={habit.$id}
                style={[styles.card, idx === 0 && styles.firstCard]}
              >
                <Card.Content>
                  <Text variant="titleMedium" style={styles.habitTitle}>
                    {habit.title}
                  </Text>
                  <Text style={styles.habitDescription}>
                    {habit.description}
                  </Text>

                  <View style={styles.statsRow}>
                    <View style={styles.streakBadge}>
                      <Text style={styles.statsText}>🔥 {streak}</Text>
                      <Text style={styles.statsLabel}>Current</Text>
                    </View>

                    <View style={styles.streakBest}>
                      <Text style={styles.statsText}>🏆 {bestStreak}</Text>
                      <Text style={styles.statsLabel}>Best</Text>
                    </View>

                    <View style={styles.streakTotal}>
                      <Text style={styles.statsText}>✅ {totalStreak}</Text>
                      <Text style={styles.statsLabel}>Total</Text>
                    </View>
                  </View>
                </Card.Content>
              </Card>
            )
          )}
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
  rankingContainer: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  rankingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#7c4dff",
    letterSpacing: 0.5,
  },
  rankingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 8,
  },
  rankingBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    backgroundColor: "#e0e0e0",
  },
  badge1: {
    backgroundColor: "#ffd700",
  },
  badge2: {
    backgroundColor: "#c0c0c0",
  },
  badge3: {
    backgroundColor: "#cd7f32",
  },
  rankingBadgeText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  rankingHabit: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  rankingStreak: {
    fontSize: 14,
    color: "#7c4dff",
    fontWeight: "bold",
  },
});
