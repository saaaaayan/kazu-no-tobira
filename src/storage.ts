import AsyncStorage from '@react-native-async-storage/async-storage';
import { decodeProgress, type Progress } from './domain/progress';

const key = 'kazu-no-tobira:progress';

export async function loadProgress(): Promise<Progress> {
  return decodeProgress(await AsyncStorage.getItem(key));
}

export async function saveProgress(progress: Progress): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(progress));
}
