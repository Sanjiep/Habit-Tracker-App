import { Tabs } from "expo-router";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import AntDesign from '@expo/vector-icons/AntDesign';
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: "#f5f5f5" },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: "#f5f5f5",
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleAlign: "center",
        tabBarActiveTintColor: "#6200ee",
        tabBarInactiveTintColor: "#666666",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today's Habits",
          tabBarIcon: ({ color }) => (
            <>
              <MaterialCommunityIcons name="calendar-today" size={24} color={color} />
            </>
          ),
        }}
      />
      <Tabs.Screen
        name="streaks"
        options={{
          title: "Streaks",
          tabBarIcon: ({ color }) => (
            <>
              <FontAwesome5 name="fire-alt" size={24} color={color} />
            </>
          ),
        }}
      />
      <Tabs.Screen
        name="add-habit"
        options={{
          title: "Add Habits",
          tabBarIcon: ({ color }) => (
            <>
             <AntDesign name="pluscircle" size={24} color={color} />
            </>
          ),
        }}
      />
    </Tabs>
  );
}
