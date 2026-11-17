import { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { naturalJapaneseSpeechText, preferredJapaneseVoice } from '../domain/japaneseSpeech';

export default function QuestionReadAloud({ text }: { text: string }) {
  const [voice,setVoice]=useState<SpeechSynthesisVoice>();
  useEffect(()=>{
    if (typeof window==='undefined' || !window.speechSynthesis) return;
    const speech=window.speechSynthesis;
    // ローカル音声だけに限定しない。日本語の自然な音声があれば優先する。
    const update=()=>setVoice(preferredJapaneseVoice(speech.getVoices()));
    update();
    speech.addEventListener('voiceschanged',update);
    return ()=>speech.removeEventListener('voiceschanged',update);
  },[]);
  useEffect(()=>()=>window.speechSynthesis?.cancel(),[text]);
  if (!voice) return null;
  return <Pressable accessibilityRole="button" accessibilityLabel="よみあげを きく" onPress={()=>{
    window.speechSynthesis.cancel();
    const message=new SpeechSynthesisUtterance(naturalJapaneseSpeechText(text));
    message.voice=voice;
    message.lang='ja-JP';
    // 遅すぎる読み上げは不自然になるため、自然な会話より少しゆっくりに。
    message.rate=0.96;
    message.pitch=1.02;
    window.speechSynthesis.speak(message);
  }} style={{alignSelf:'flex-start',padding:12,minHeight:44,borderRadius:10,backgroundColor:'#ffebae'}}>
    <Text style={{fontSize:17,fontWeight:'800',color:'#27335c'}}>🔊 きく</Text>
  </Pressable>;
}
