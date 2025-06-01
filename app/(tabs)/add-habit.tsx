import { View, StyleSheet } from "react-native";
import React, { useState } from "react";
import { Button, SegmentedButtons, TextInput, useTheme, Text } from "react-native-paper";
import { useAuth } from "@/lib/auth-context";
import { DATABASE_ID, databases, HABITS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from "react-native-appwrite";
import { useRouter } from "expo-router";

const FREQUENCY_OPTIONS = ["daily", "weekly", "monthly"];
type Frequency = (typeof FREQUENCY_OPTIONS)[number];
export default function AddHabitScreen() {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const {user} = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme()

  const handleSubmit = async() => {
    if (!user) return
    try {
    await databases.createDocument(DATABASE_ID, HABITS_COLLECTION_ID, ID.unique(),{
      user_id: user.$id,
      title,
      description,
      frequency,
      streak_count: 0,
      last_completed: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })
    

    router.back();
  } catch (error) {
    if (error instanceof Error) {
      setError(error.message);
    } else {
      setError("An unknown error occurred while adding the habit.");
  }
  }
}
  return (
    <View style={Styles.container}>
      <TextInput
      onChangeText={setTitle}
        style={Styles.input}
        label="Title"
        textColor="#000"
        mode="outlined"
      />
      <TextInput onChangeText={setDescription} style={Styles.input} label="Description" mode="outlined" />
      <View style={Styles.frequencyContainer}>
        <SegmentedButtons
          buttons={FREQUENCY_OPTIONS.map((freq) => ({
            value: freq,
            label: freq.charAt(0).toUpperCase() + freq.slice(1),
          }))}
          style={Styles.segmentedButtons}
          value={frequency}
          onValueChange ={(value) => {
            setFrequency(value as Frequency);
          }}
        />
      </View>
      <Button
        style={Styles.button}
        mode="contained"
        icon="plus"
        disabled={!title || !description}
        // You can replace the onPress function with your own logic to handle adding the habit
        onPress={handleSubmit}
      >
        Add Habit
      </Button>
      {error &&
          <Text style={{ color: theme.colors.error }}>{error}</Text>
        }
    </View>
  );
}

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,

    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  frequencyContainer: {
    marginBottom: 24,
  },
  segmentedButtons: {
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  button: {
    marginTop: 8,
    alignSelf: "center",
    minWidth: 120,
  },
});
