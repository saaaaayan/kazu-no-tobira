import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_KEY='kazu-no-tobira:sound-effects-enabled';

/** The first visit is sound-on. An explicit mute persists across reloads.
 * Sound preferences must not alter or reset children's learning records.
 */
export async function readSoundEffectsEnabled():Promise<boolean>{
  try{
    return (await AsyncStorage.getItem(SOUND_KEY))!=='off';
  }catch{
    return true;
  }
}

export async function saveSoundEffectsEnabled(enabled:boolean):Promise<void>{
  try{
    await AsyncStorage.setItem(SOUND_KEY,enabled?'on':'off');
  }catch{
    // A private tab or disabled storage must not block the settings panel.
  }
}
