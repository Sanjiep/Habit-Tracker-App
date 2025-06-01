import { useAuth } from "@/lib/auth-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, View, StyleSheet } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>("");

  const theme = useTheme();
  const router = useRouter();

  const {signIn, signUp} = useAuth();

  const handleAuth = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setError(null);
    
    if (isSignUp) {
       const error = await signUp(email, password)
       if (error) {
         setError(error);
         return;
       }
    }else{
       const error = await signIn(email, password);
         if (error) {
            setError(error);
            return;
         }

         router.replace("/")
    }
  };

  const handleSwitchMode = () => {
    setIsSignUp((prev) => !prev);
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>
          {isSignUp ? "Create Account" : "Welcome Back!"}
        </Text>

        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="example@mail.com"
          label="Email"
          mode="outlined"
          onChangeText={setEmail}
        />

        <TextInput
          label="Password"
          secureTextEntry
          placeholder="password"
          mode="outlined"
          style={styles.input}
          onChangeText={setPassword}
        />

        {error &&
          <Text style={{ color: theme.colors.error }}>{error}</Text>
        }

        <Button style={styles.button} mode="contained" onPress={handleAuth}>
          {isSignUp ? "Sign Up" : "Sign In"}
        </Button>
        <Button
          style={styles.switchButton}
          onPress={handleSwitchMode}
          mode="text"
        >
          {isSignUp
            ? "Already have an accout? Sign In"
            : "Don't have an account? Sign Up"}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
    marginBottom: 80,
  },
  title: {
    fontSize: 26,
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "bold",
  },
  input: {
    marginBottom: 12,
  },
  button: {
    minWidth: 100,
    alignSelf: "center",
    marginTop: 8,
  },
  switchButton: {
    alignSelf: "center",
    marginTop: 20,
  },
});
