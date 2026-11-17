import { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';

export default function QuestionReadAloud({ text }: { text: string }) {
  const [voice,setVoice]=useState<SpeechSynthesisVoice>();
  useEffect(()=>{
    const speech=window.speechSynthesis;
    if (!speech) return;
    const update=()=>setVoice(speech.getVoices().find(item=>item.localService && /^ja(?:-|$)/i.test(item.lang)));
    update();
    speech.addEventListener('voiceschanged',update);
    return ()=>speech.removeEventListener('voiceschanged',update);
  },[]);
  useEffect(()=>()=>window.speechSynthesis?.cancel(),[text]);
  if (!voice) return null;
  return <Pressable accessibilityRole="button" accessibilityLabel="よみあげを きく" onPress={()=>{
    window.speechSynthesis.cancel();
    const message=new SpeechSynthesisUtterance(text);
    message.voice=voice;
    message.lang=voice.lang;
    message.rate=0.85;
    window.speechSynthesis.speak(message);
  }} style={{alignSelf:'flex-start',padding:12,minHeight:44,borderRadius:10,backgroundColor:'#ffebae'}}>
    <Text style={{fontSize:17,fontWeight:'800',color:'#27335c'}}>🔊 きく</Text>
  </Pressable>;
}
