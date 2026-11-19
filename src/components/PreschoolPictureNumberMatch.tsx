import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import type { CountingToken } from '../domain/countingTokens';
import { countingTokenArt } from '../domain/countingTokens';

export type PictureNumberMatch = {
  pictures: readonly { token:CountingToken; count:number }[];
  numbers: readonly number[];
};

/** The first (left-hand) group is position 0 in the answer. All three
 * connections must be made, and each digit may be used only once. */
export function pictureNumberMatchAnswer(match:PictureNumberMatch):string {
  return match.pictures.map(p=>p.count).join('-');
}
export function pictureNumberConnectedAnswer(match:PictureNumberMatch,links:Readonly<Record<number,number>>):string {
  const indexes=match.pictures.map((_,i)=>links[i]);
  if(indexes.some(i=>i===undefined||i<0||i>=match.numbers.length) ||
    new Set(indexes).size!==match.pictures.length)return '';
  return indexes.map(i=>match.numbers[i]).join('-');
}

const rowHeight=94;
const rowGap=12;
const boardHeight=rowHeight*3+rowGap*2;
const centerY=(i:number)=>i*(rowHeight+rowGap)+rowHeight/2;

/** The lines are real connections, not a multiple-choice surrogate.
 * First touch a picture, then touch a number; a line is drawn between them.
 * This two-tap method works with a finger, mouse, or keyboard/screen reader
 * and doesn't require a child to hold a drag gesture precisely.
 */
export default function PreschoolPictureNumberMatch({ match, disabled, onChange, onSubmit }: {
  match:PictureNumberMatch;disabled:boolean;
  onChange:(answer:string)=>void;onSubmit:(answer:string)=>void;
}){
  const [active,setActive]=useState<number|null>(null);
  const [links,setLinks]=useState<Record<number,number>>({});
  const [width,setWidth]=useState(0);
  const [note,setNote]=useState('まず ひだりの えを さわってね。');
  const onChangeRef=useRef(onChange);
  onChangeRef.current=onChange;
  const answer=pictureNumberConnectedAnswer(match,links);
  useEffect(()=>{onChangeRef.current(answer);},[answer]);

  function selectPicture(index:number){
    if(disabled)return;
    setActive(index);
    setNote('つぎに、みぎの すうじを さわってね。');
  }
  function selectNumber(index:number){
    if(disabled)return;
    if(active===null){
      setNote('まず ひだりの えを さわってね。');
      return;
    }
    setLinks(current=>{
      const next={...current};
      for(const key of Object.keys(next)){
        if(next[Number(key)]===index)delete next[Number(key)];
      }
      next[active]=index;
      return next;
    });
    setActive(null);
    setNote('せんで つながったよ！ ほかも むすぼう。');
  }
  const done=answer!=='';
  const connected=Object.keys(links).length;
  return <View testID="preschool-picture-number-matching" style={styles.container}>
    <Text style={styles.instruction}>えを さわって、すうじを さわろう。</Text>
    <Text style={styles.guide} accessibilityLiveRegion="polite">
      {done?'3つ とも つながったね！ こたえあわせを おそう。':note}
    </Text>
    <View testID="preschool-picture-number-board"
      style={styles.board} onLayout={e=>{
        const next=e.nativeEvent.layout.width;
        if(next!==width)setWidth(next);
      }}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {width>0&&<Svg width={width} height={boardHeight}
          viewBox={`0 0 ${width} ${boardHeight}`}>
          {Object.entries(links).map(([from,to])=>(
            <Line key={'match-'+from} x1={width*.405} y1={centerY(Number(from))}
              x2={width*.595} y2={centerY(to)}
              stroke="#486a92" strokeWidth={5} strokeLinecap="round"/>
          ))}
          {Object.entries(links).map(([from,to])=>(
            <Circle key={'endpoint-'+from} cx={width*.595} cy={centerY(to)}
              r={5} fill="#486a92"/>
          ))}
        </Svg>}
      </View>
      <View style={styles.column}>
        {match.pictures.map((p,i)=>{
          const icon=countingTokenArt[p.token][0],label=countingTokenArt[p.token][1];
          const selected=active===i;
          return <Pressable key={i} testID={'preschool-picture-'+i}
            accessibilityRole="button" accessibilityLabel={label+'が'+p.count+'こ'}
            accessibilityState={{selected,disabled}}
            disabled={disabled} onPress={()=>selectPicture(i)}
            style={[styles.card,selected&&styles.selected]}>
            <Text style={styles.picture} adjustsFontSizeToFit>{icon.repeat(p.count)}</Text>
          </Pressable>;
        })}
      </View>
      <View style={styles.column}>
        {match.numbers.map((n,i)=>(
          <Pressable key={i} testID={'preschool-number-'+n}
            accessibilityRole="button" accessibilityLabel={'すうじの '+n}
            accessibilityState={{disabled}}
            disabled={disabled} onPress={()=>selectNumber(i)}
            style={[styles.card,styles.numberCard]}>
            <Text style={styles.number}>{n}</Text>
          </Pressable>
        ))}
      </View>
    </View>
    <Text style={styles.progress}>{connected} / 3 つながったよ</Text>
    <Pressable testID="preschool-matching-grade"
      accessibilityRole="button" disabled={disabled||!done}
      accessibilityState={{disabled:disabled||!done}}
      style={[styles.grade,(!done||disabled)&&styles.gradeDisabled]}
      onPress={()=>{if(done&&!disabled)onSubmit(answer);}}>
      <Text style={styles.gradeText}>こたえあわせ</Text>
    </Pressable>
    <Text style={styles.repair}>なおすときは、えを さわって べつの すうじに つなごう。</Text>
  </View>;
}
const styles=StyleSheet.create({
  container:{width:'100%',maxWidth:720,alignSelf:'center',gap:11,paddingTop:8},
  instruction:{color:'#fff0b5',fontSize:20,fontWeight:'900',textAlign:'center'},
  guide:{color:'#f9f6e8',fontSize:15,lineHeight:23,fontWeight:'800',textAlign:'center'},
  board:{height:boardHeight,width:'100%',position:'relative',flexDirection:'row',
    justifyContent:'space-between'},
  column:{width:'40%',height:boardHeight,justifyContent:'space-between'},
  card:{height:rowHeight,width:'100%',borderWidth:3,borderColor:'#d3c8a4',
    backgroundColor:'#fff9e6',borderRadius:11,alignItems:'center',
    justifyContent:'center',paddingHorizontal:4},
  selected:{borderColor:'#3f87b2',backgroundColor:'#dff3fd'},
  picture:{textAlign:'center',fontSize:27,lineHeight:38,flexShrink:1},
  numberCard:{borderColor:'#bbc6dc',backgroundColor:'#f1f6ff'},
  number:{fontSize:38,fontWeight:'900',color:'#26395c',textAlign:'center'},
  progress:{color:'#fdf2cb',fontSize:15,textAlign:'center',fontWeight:'800'},
  grade:{minHeight:54,borderRadius:10,backgroundColor:'#ffebad',alignItems:'center',
    justifyContent:'center',padding:8},
  gradeDisabled:{opacity:.5},
  gradeText:{fontSize:19,color:'#28395a',fontWeight:'900'},
  repair:{fontSize:13,color:'#f4eddd',lineHeight:20,textAlign:'center'},
});
