import {Account, Client, Databases} from 'react-native-appwrite';

export const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!) // Your Appwrite Endpoint
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!) // Your project ID
  .setPlatform(process.env.EXPO_PUBLIC_APPWRITE_PLATFORM!)

export const account = new Account(client);
export const databases = new Databases(client);

export const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DB_ID!;
export const HABITS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_HABITS_COLLECTION_ID!;
export const COMPLETIONS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_COMPLETIONS_COLLECTION_ID!;

export interface RealtimeResponse {
  events: string[];
  payload: any;
}