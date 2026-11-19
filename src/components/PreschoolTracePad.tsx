import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import InkSurface from './InkSurface';
import type { Point } from '../domain/ink';

/**
 * Actual finger-drawing practice for preschool 11–15. There is no reliable
 * digit recognizer in the public prototype: completion proves a continuous
 * finger movement, NOT handwriting accuracy. Never report recognition.
 */
export default function PreschoolTracePad({digit,disabled,onChange}:{
  digit:string;disabled:boolean;onChange:(value:string)=>void;
}) {
  const [strokes,setStrokes]=useState<Point[][]>([]);
  const active=useRef<Point[]>([]);
  const [preview,setPreview]=useState<Point[]>([]);
  const [size,setSize]=useState({width:280,height:168});
  const [completed,setCompleted]=useState(false);
  const drawn=[...strokes,...(preview.length?[preview]:[])];
  function reset() {active.current=[];setPreview([]);setStrokes([]);setCompleted(false);onChange('');}
  function finish(){
    const current=active.current;
    active.current=[];
    if(current.length<2){setPreview([]);return;}
    const total= current.reduce((s,p,i)=>i? s+Math.hypot(p.x-current[i-1].x,p.y-current[i-1].y):0,0);
    const next=[...strokes,current];setStrokes(next);setPreview([]);
    if(total>size.width*.4 && current.length>=7){
      setCompleted(true);onChange('できた');
    }
  }
  return <View style={styles.container}>
    <Text style={styles.instruction}>おてほんを みながら、ゆびで なぞってね</Text>
    <View style={styles.paper} onLayout={e=>setSize({
      width:e.nativeEvent.layout.width,height:e.nativeEvent.layout.height,
    })}>
      <View pointerEvents="none" style={styles.guide}>
        <Text style={styles.guideText}>{digit}</Text>
      </View>
      <InkSurface label={digit+'を ゆびで なぞる ところ'}
        start={point=>{if(disabled)return;active.current=[point];setPreview([point]);}}
        move={point=>{if(disabled||!active.current.length)return;const next=[...active.current,point];active.current=next;setPreview(next);}}
        finish={()=>{if(!disabled)finish();}} cancel={()=>{active.current=[];setPreview([]);}}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${size.width} ${size.height}`}>
          {drawn.map((stroke,i)=><Polyline key={i}
            points={stroke.map(p=>`${p.x},${p.y}`).join(' ')} stroke="#405b8c"
            fill="none" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round"/>)}
        </Svg>
      </InkSurface>
    </View>
    <View style={styles.toolbar}>
      <Pressable accessibilityRole="button" disabled={disabled}
        onPress={reset} style={styles.button}><Text style={styles.buttonText}>かきなおす</Text></Pressable>
      <Text style={styles.status}>{completed?'かけたね！ こたえあわせを おそう':'おてほんの せんを なぞろう'}</Text>
    </View>
    <Text style={styles.note}>この れんしゅうでは、かたちの じどう はんていは まだ できないよ。</Text>
  </View>;
}
const styles=StyleSheet.create({
  container:{gap:10,width:'100%',minWidth:0},
  instruction:{color:'#31445d',fontSize:17,fontWeight:'900'},
  paper:{position:'relative',width:'100%',height:188,backgroundColor:'#fffaf0',borderWidth:2,borderColor:'#8d9d95',borderRadius:8,overflow:'hidden'},
  guide:{...StyleSheet.absoluteFill,alignItems:'center',justifyContent:'center'},
  guideText:{fontSize:134,lineHeight:169,fontWeight:'900',color:'#d5dacf',textAlign:'center'},
  toolbar:{flexDirection:'row',flexWrap:'wrap',alignItems:'center',gap:10},
  button:{minHeight:44,borderWidth:1,borderColor:'#596984',backgroundColor:'#e6e8e4',
    paddingHorizontal:16,justifyContent:'center',borderRadius:6},
  buttonText:{color:'#344454',fontWeight:'800'},
  status:{flex:1,color:'#355969',fontSize:14,fontWeight:'700'},
  note:{color:'#576e6f',fontSize:11},
});
