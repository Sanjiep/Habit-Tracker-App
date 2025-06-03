import {
  client,
  COMPLETIONS_COLLECTION_ID,
  DATABASE_ID,
  databases,
  HABITS_COLLECTION_ID,
  RealtimeResponse,
} from "@/lib/appwrite";
import { useAuth } from "@/lib/auth-context";
import { Habit, HabitCompletion } from "@/types/database.type";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useEffect, useRef, useState } from "react";
import { Text, View, StyleSheet, ScrollView } from "react-native";
import { ID, Query } from "react-native-appwrite";
import { Swipeable } from "react-native-gesture-handler";
import { Button, Surface } from "react-native-paper";

export default function Index() {
  const { signOut, user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>();
  const [completedHabits, setCompletedHabits] = useState<string[]>();

  const swipeableRef = useRef<{ [key: string]: Swipeable | null }>({});

  useEffect(() => {
    if (!user) return;
    // Subscribe to real-time updates for habits

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
          fetchTodayCompletions();
        }
      }
    );

    fetchHabits();
    fetchTodayCompletions();

    // Cleanup on unmount
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

  const fetchTodayCompletions = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of the day
      const response = await databases.listDocuments(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        [
          Query.equal("user_id", user?.$id ?? ""),
          Query.greaterThanEqual("completed_at", today.toISOString()),
        ]
      );

      const completions = response.documents as HabitCompletion[];
      setCompletedHabits(completions.map((c) => c.habit_id));
    } catch (error) {
      console.error("Error fetching habits:", error);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    try {
      await databases.deleteDocument(DATABASE_ID, HABITS_COLLECTION_ID, id);
    } catch (error) {
      console.error("Error deleting habit:", error);
    }
  };

  const handleCompletionHabit = async (id: string) => {
    if (!user || completedHabits?.includes(id)) return;
    try {
      const currentDate = new Date().toISOString();
      await databases.createDocument(
        DATABASE_ID,
        COMPLETIONS_COLLECTION_ID,
        ID.unique(),
        {
          habit_id: id,
          user_id: user.$id,
          completed_at: currentDate,
        }
      );
  
      const habit = habits?.find((h) => h.$id === id);
      if (!habit) return;
  
      await databases.updateDocument(DATABASE_ID, HABITS_COLLECTION_ID, id, {
        streak_count: habit.streak_count + 1,
        last_completed: currentDate,
      });
  
      // ✅ Immediately update UI
      await fetchTodayCompletions();
      await fetchHabits();
      // setRefreshKey((prev) => prev + 1); // optional if still not rendering
    } catch (error) {
      console.error(error);
    }
  };
  
  

  const isHabitCompleted = (habitId: string) =>
    completedHabits?.includes(habitId);

  const renderLeftAction = () => (
    <View style={styles.leftAction}>
      <MaterialCommunityIcons
        name="delete"
        size={32}
        color="#fff"
        style={{ marginLeft: 10, marginTop: 10 }}
      />
    </View>
  );
  const renderRightAction = (habitID: string) => (
    <View style={styles.rightAction}>
      {isHabitCompleted(habitID) ? (
        <Text style={styles.text}>Completed!</Text>
      ) : (
        <MaterialCommunityIcons
          name="check-circle"
          size={32}
          color="#fff"
          style={{ marginRight: 10, marginTop: 10 }}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Todays Habit</Text>
        <Button
          style={styles.Button}
          mode="text"
          onPress={signOut}
          icon={"logout"}
          textColor="#fff"
        >
          Sign Out
        </Button>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {habits?.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No Habits yet. Add Habit</Text>
          </View>
        ) : (
          habits?.map((habit, key) => (
            <Swipeable
              ref={(ref) => {
                swipeableRef.current[habit.$id] = ref;
              }}
              key={habit.$id}
              overshootLeft={false}
              overshootRight={false}
              renderLeftActions={renderLeftAction}
              renderRightActions={() => renderRightAction(habit.$id)}
              onSwipeableOpen={(direction) => {
                if (direction === "left") {
                  handleDeleteHabit(habit.$id);
                } else if (direction === "right") {
                  handleCompletionHabit(habit.$id);
                  swipeableRef.current[habit.$id]?.close();
                }
              }}
            >
              <Surface
                key={habit.$id}
                style={[
                  styles.card,
                  isHabitCompleted(habit.$id) && styles.cardCompleted,
                ]}
                elevation={1}
              >
                <View style={styles.cardHabit}>
                  <Text style={styles.cardTitle}>{habit.title}</Text>
                  <Text style={styles.cardDescription}>
                    {habit.description}
                  </Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.streakBadge}>
                      <MaterialCommunityIcons
                        name="fire"
                        size={24}
                        color={"#ff9800"}
                      />
                      <Text style={styles.streakText}>
                        {habit.streak_count} days streak
                      </Text>
                    </View>
                    <View style={styles.frequencyBadge}>
                      <Text style={styles.frequencyText}>
                        {habit.frequency.charAt(0).toUpperCase() +
                          habit.frequency.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
              </Surface>
            </Swipeable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  text: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  card: {
    marginBottom: 16,
    padding: 0,
    backgroundColor: "#f7f2fa",
    borderRadius: 18,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  cardCompleted: {
    opacity: 0.6,
    backgroundColor: "#e8f5e9",
  },
  cardHabit: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    padding: 8,
    borderRadius: 12,
    shadowColor: "#000",
  },
  streakText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#ff9800",
    fontWeight: "bold",
  },
  frequencyBadge: {
    backgroundColor: "#ede7f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: "#000",
  },
  frequencyText: {
    fontSize: 16,
    color: "#7c4dff",
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },

  emptyStateText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  Button: {
    backgroundColor: "#9a6ad4",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  leftAction: {
    backgroundColor: "#e53935",
    justifyContent: "center",
    alignItems: "flex-start",
    flex: 1,
    borderRadius: 18,
    marginBottom: 16,
    marginTop: 2,
    paddingRight: 16,
  },
  rightAction: {
    backgroundColor: "#4caf50",
    justifyContent: "center",
    alignItems: "flex-end",
    flex: 1,
    borderRadius: 18,
    marginBottom: 16,
    marginTop: 2,
    paddingRight: 16,
  },
});
