import AsyncStorage from '@react-native-async-storage/async-storage';
import { emptyProgress, type Progress } from './domain/progress';

const key = 'kazu-no-tobira:progress';

export async function loadProgress(): Promise<Progress> {
  const data = await AsyncStorage.getItem(key);
  if (data === null) return emptyProgress;
  const saved: Progress | null = JSON.parse(data);
  if (saved?.version !== 1 || !Array.isArray(saved.attempts) ||
      !saved.skills || typeof saved.skills !== 'object' || Array.isArray(saved.skills) ||
      !saved.stages || typeof saved.stages !== 'object' || Array.isArray(saved.stages)) {
    throw new Error('Unsupported progress data.');
  }
  return saved;
}

export async function saveProgress(progress: Progress): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(progress));
}
