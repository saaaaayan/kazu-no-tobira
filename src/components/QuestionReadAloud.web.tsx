import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { naturalJapaneseSpeechText, preferredJapaneseVoice } from '../domain/japaneseSpeech';

const unavailableMessage='いまは おとが でないよ。';

/**
 * モバイルのブラウザーでは getVoices() が空のままでも speak() が使えることがある。
 * 日本語の音声一覧が取得できないだけで「きく」を消さない。
 */
export default function QuestionReadAloud({ text }: { text: string }) {
  const [voice,setVoice]=useState<SpeechSynthesisVoice>();
  const [error,setError]=useState('');
  const activeUtterance=useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(()=>{
    if (typeof window==='undefined' || !window.speechSynthesis) return;
    const speech=window.speechSynthesis;
    const update=()=>setVoice(preferredJapaneseVoice(speech.getVoices()));
    update();
    speech.addEventListener?.('voiceschanged',update);
    return ()=>speech.removeEventListener?.('voiceschanged',update);
  },[]);

  useEffect(()=>()=>{
    if (typeof window!=='undefined') window.speechSynthesis?.cancel();
    activeUtterance.current=null;
  },[text]);

  const read=()=>{
    // スマホの初回再生は利用者のタップ中に speak() する。
    if (typeof window==='undefined' || !window.speechSynthesis || typeof SpeechSynthesisUtterance==='undefined') {
      setError(unavailableMessage);
      return;
    }
    const speech=window.speechSynthesis;
    setError('');
    speech.cancel();
    const message=new SpeechSynthesisUtterance(naturalJapaneseSpeechText(text));
    // getVoices() が空配列でも音声は使えることがあるため、voice は省略可能。
    const selected=preferredJapaneseVoice(speech.getVoices()) ?? voice;
    if (selected) message.voice=selected;
    message.lang='ja-JP';
    message.rate=0.96;
    message.pitch=1.02;
    activeUtterance.current=message;
    message.onend=()=>{
      if(activeUtterance.current===message) activeUtterance.current=null;
    };
    message.onerror=event=>{
      if(activeUtterance.current!==message) return;
      activeUtterance.current=null;
      // 新しく読み上げ直したときのキャンセルはエラーとして表示しない。
      if(event.error!=='canceled' && event.error!=='interrupted') setError(unavailableMessage);
    };
    try {
      speech.speak(message);
    } catch {
      activeUtterance.current=null;
      setError(unavailableMessage);
    }
  };

  return <View style={{alignSelf:'flex-start',gap:5}}>
    <Pressable accessibilityRole="button" accessibilityLabel="よみあげを きく"
      onPress={read}
      style={{alignSelf:'flex-start',padding:12,minHeight:44,borderRadius:10,backgroundColor:'#ffebae'}}>
      <Text style={{fontSize:17,fontWeight:'800',color:'#27335c'}}>🔊 きく</Text>
    </Pressable>
    {!!error && <Text accessibilityLiveRegion="polite"
      style={{fontSize:14,color:'#ffecc0',fontWeight:'700'}}>{error}</Text>}
  </View>;
}
