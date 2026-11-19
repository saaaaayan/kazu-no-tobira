import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { normalizePoint, toPixels, type Drawing, type Point, type Size } from '../domain/ink';
import digitRecognizer from '../recognition/digitRecognizer';
import { createRecognitionQueue } from '../recognition/recognitionQueue';
import { preschoolTraceInkQuality, preschoolTraceMatches } from '../domain/preschoolTraceRecognition';
import { preschoolDigitGuidePaths, preschoolTraceGuideMatch, type PreschoolGuideMatch } from '../domain/preschoolTraceGuide';
import InkSurface from './InkSurface';

type TraceStatus = 'idle' | 'drawing' | 'checking' | 'matched' | 'small' | 'scribble' | 'different' | 'unavailable';

/**
 * Genuine numeral recognition for the preschool Web prototype.
 * Each digit must be recognised as the expected digit, not merely drawn over,
 * coloured in, or held down for long enough. A two-digit "10" has two
 * separately recognised writing cells so it cannot be guessed as one shape.
 * The classifier sees the strokes only; the exercise answer is compared
 * AFTER recognition.
 */
export default function PreschoolTracePad({ digit, disabled, onChange }: {
  digit:string;disabled:boolean;onChange:(value:string)=>void;
}) {
  const digits=digit==='10'?['1','0']:[digit];
  const [matches,setMatches]=useState<boolean[]>(()=>digits.map(()=>false));
  const onChangeRef=useRef(onChange);
  onChangeRef.current=onChange;
  useEffect(()=>{
    onChangeRef.current(matches.length===digits.length&&matches.every(Boolean)?'できた':'');
  },[matches,digit]);

  function setPart(index:number,matched:boolean){
    setMatches(current=>current[index]===matched?current:current.map((value,i)=>i===index?matched:value));
  }

  return <View testID="preschool-trace-recognition" style={styles.container}>
    <Text style={styles.instruction}>おてほんを みて、すうじを かいてね</Text>
    <View style={styles.cells}>
      {digits.map((number,index)=>(
        <View key={index} style={[styles.cell,digits.length>1&&styles.halfCell]}>
          {digits.length>1&&<Text style={styles.cellLabel}>{index+1}つめ：{number}</Text>}
          <RecognizedDigitCell key={number+'-'+index}
            target={number} disabled={disabled} onMatched={matched=>setPart(index,matched)}/>
        </View>
      ))}
    </View>
    <Text style={styles.note}>かたちを たしかめるよ。ぬりつぶすだけでは せいかいに ならないよ。</Text>
    {matches.every(Boolean)&&<Text accessibilityLiveRegion="polite" style={styles.allDone}>
      じょうずに かけたね！「こたえあわせ」を おしてね。
    </Text>}
  </View>;
}

function RecognizedDigitCell({target,disabled,onMatched}:{
  target:string;disabled:boolean;onMatched:(matched:boolean)=>void;
}) {
  const [strokes,setStrokes]=useState<Drawing>([]);
  const [preview,setPreview]=useState<Point[]>([]);
  const [size,setSize]=useState<Size>({width:0,height:0});
  const active=useRef<Point[]|null>(null);
  const [status,setStatus]=useState<TraceStatus>('idle');
  const cb=useRef({target,onMatched});
  cb.current={target,onMatched};
  const lastGuideMatch=useRef<PreschoolGuideMatch|undefined>(undefined);
  const [queue]=useState(()=>createRecognitionQueue(digitRecognizer.recognize,result=>{
    // ML can help with slightly off-guide writing; it cannot accept unrelated
    // marks. For a faithful trace of the VISIBLE guide, the geometry itself
    // is stronger evidence than a low-confidence generic digit classifier.
    const guide=lastGuideMatch.current;
    const modelMatch=preschoolTraceMatches(cb.current.target,result,'plausible') &&
      !!guide && guide.distinct && guide.inkNear>=.55 && guide.guideCovered>=.56 &&
      guide.lengthRatio>=.5 && guide.lengthRatio<=1.85;
    cb.current.onMatched(modelMatch);
    setStatus(modelMatch?'matched':'different');
  },550));

  useEffect(()=>()=>queue.cancel(),[queue]);

  function begin(p:Point){
    if(disabled||!size.width||!size.height)return;
    queue.cancel();
    lastGuideMatch.current=undefined;
    cb.current.onMatched(false);
    active.current=[normalizePoint(p,size)];
    setPreview(active.current);
    setStatus('drawing');
  }
  function move(p:Point){
    if(disabled||!active.current)return;
    const point=normalizePoint(p,size);
    const last=active.current.at(-1);
    if(last&&Math.hypot((last.x-point.x)*size.width,(last.y-point.y)*size.height)<0.7)return;
    active.current=[...active.current,point];
    setPreview(active.current);
  }
  function finish(){
    if(disabled||!active.current)return;
    const completed=active.current;
    active.current=null;
    setPreview([]);
    if(completed.length<2){setStatus('small');return;}
    const next=[...strokes,completed];
    setStrokes(next);
    const quality=preschoolTraceInkQuality({drawing:next,size});
    if(quality!=='plausible'){
      setStatus(quality==='scribble'?'scribble':'small');
      return;
    }
    const guideMatch=preschoolTraceGuideMatch(target,{drawing:next,size});
    lastGuideMatch.current=guideMatch;
    if(guideMatch.matched){
      // Correct thin strokes need not be rejected by an uncertain ML label.
      queue.cancel();
      cb.current.onMatched(true);
      setStatus('matched');
      return;
    }
    if(!digitRecognizer.available){setStatus('unavailable');return;}
    setStatus('checking');
    queue.schedule({drawing:next,size});
  }
  function reset(){
    queue.cancel();
    lastGuideMatch.current=undefined;
    active.current=null;
    setPreview([]);
    setStrokes([]);
    setStatus('idle');
    cb.current.onMatched(false);
  }
  const all=preview.length?[...strokes,preview]:strokes;
  const message:Record<TraceStatus,string>={
    idle:'せんで かいてみよう。',
    drawing:'ゆっくり かいてね。',
    checking:'すうじの かたちを たしかめているよ…',
    matched:'「'+target+'」と よみとれたよ！',
    small:'もうすこし おおきく かいてね。',
    scribble:'ぬりつぶさず、すうじの せんを かいてね。',
    different:'おてほんを みて、もういちど かいてみよう。',
    unavailable:'この たんまつでは てがきの はんていが つかえないよ。',
  };
  return <View style={styles.single}>
    <View style={styles.paper}
      onLayout={event=>setSize(previous=>{
        const {width,height}=event.nativeEvent.layout;
        return previous.width===width&&previous.height===height?previous:{width,height};
      })}>
      <View pointerEvents="none" style={styles.guide}>
        {size.width>0&&size.height>0&&(
          <Svg width="100%" height="100%" viewBox={`0 0 ${size.width} ${size.height}`}>
            {preschoolDigitGuidePaths(target,size).map((stroke,i)=>(
              <Polyline key={'guide-'+i}
                points={stroke.map(p=>`${p.x},${p.y}`).join(' ')}
                fill="none" stroke="#cdd6cb" strokeWidth={9}
                strokeLinecap="round" strokeLinejoin="round"/>
            ))}
          </Svg>
        )}
      </View>
      <InkSurface label={'すうじの '+target+' を てがきする ところ'}
        start={begin} move={move} finish={finish}
        cancel={()=>{active.current=null;setPreview([]);setStatus('idle');}}>
        {size.width>0&&size.height>0&&(
          <Svg width="100%" height="100%" viewBox={`0 0 ${size.width} ${size.height}`}>
            {all.map((stroke,i)=><Polyline key={i}
              points={stroke.map(p=>{const xy=toPixels(p,size);return `${xy.x},${xy.y}`;}).join(' ')}
              stroke="#405b8c" fill="none" strokeWidth={3.5}
              strokeLinecap="round" strokeLinejoin="round"/>)}
          </Svg>
        )}
      </InkSurface>
    </View>
    <Text accessibilityLiveRegion="polite"
      style={[styles.status,status==='matched'&&styles.success]}>{message[status]}</Text>
    <Pressable accessibilityRole="button" disabled={disabled}
      onPress={reset} style={[styles.reset,disabled&&styles.dim]}>
      <Text style={styles.resetText}>かきなおす</Text>
    </Pressable>
  </View>;
}

const styles=StyleSheet.create({
  container:{gap:12,width:'100%',minWidth:0},
  instruction:{color:'#fff0b5',fontSize:18,fontWeight:'900'},
  cells:{width:'100%',flexDirection:'row',flexWrap:'wrap',gap:10},
  cell:{width:'100%',minWidth:0,gap:4},
  halfCell:{width:'48%',flexGrow:1},
  cellLabel:{color:'#31445d',fontSize:15,fontWeight:'800'},
  single:{gap:8,minWidth:0},
  paper:{width:'100%',height:188,backgroundColor:'#fffaf0',
    borderWidth:2,borderColor:'#8d9d95',borderRadius:8,overflow:'hidden'},
  guide:{...StyleSheet.absoluteFill,alignItems:'center',justifyContent:'center'},
  status:{color:'#f5f0db',fontSize:15,lineHeight:23,fontWeight:'800',minHeight:23},
  success:{color:'#beffd7'},
  reset:{minHeight:44,alignSelf:'flex-start',justifyContent:'center',
    paddingHorizontal:15,backgroundColor:'#e6e8e4',borderWidth:1,
    borderColor:'#596984',borderRadius:6},
  resetText:{color:'#344454',fontSize:14,fontWeight:'800'},
  dim:{opacity:.6},
  note:{fontSize:12,color:'#e3e9f0',lineHeight:18},
  allDone:{fontSize:16,lineHeight:24,fontWeight:'900',color:'#beffd7'},
});
