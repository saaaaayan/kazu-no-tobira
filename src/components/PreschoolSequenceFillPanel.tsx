import {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {type PreschoolSequenceFill} from '../domain/preschoolSequenceFill';

/** Stage 20: ten-number sequence with individually selectable empty slots.
 * Five tiles per row keep digits readable on a narrow phone. Children can
 * correct either slot before tapping the single answer-check button.
 */
export default function PreschoolSequenceFillPanel({sequence,disabled,onSubmit}:{
  sequence:PreschoolSequenceFill;
  disabled:boolean;
  onSubmit:(value:string)=>void;
}){
  const [filled,setFilled]=useState<string[]>(()=>sequence.missingIndices.map(()=>''));
  const [active,setActive]=useState(0);
  const complete=filled.every(Boolean);
  const choose=(value:string)=>{
    if(disabled)return;
    const next=[...filled];
    next[active]=value;
    setFilled(next);
    const empty=next.findIndex(item=>!item);
    if(empty!==-1)setActive(empty);
    else if(active===0&&next.length>1)setActive(1);
  };
  return <View testID="preschool-sequence-fill-panel" style={styles.outer}>
    <Text style={styles.instruction}>□を さわって、すうじを いれよう</Text>
    <View testID="preschool-sequence-grid" style={styles.grid}>
      {Array.from({length:sequence.length},(_,i)=>{
        const slot=sequence.missingIndices.indexOf(i);
        const isBlank=slot>=0;
        return isBlank
          ? <Pressable key={i} testID={'sequence-blank-'+slot}
              accessibilityRole="button"
              accessibilityLabel={slot+1+'こめの あいている ところ。'+(filled[slot]||'まだ からっぽ')}
              accessibilityState={{selected:slot===active,disabled}}
              disabled={disabled} onPress={()=>setActive(slot)}
              style={[styles.cell,styles.blank,active===slot&&styles.active]}>
              {filled[slot]
                ? <Text style={styles.cellText}>{filled[slot]}</Text>
                : <View testID="sequence-empty-square" style={styles.emptySquare}/>}
            </Pressable>
          : <View key={i} style={styles.cell}>
              <Text style={styles.cellText}>{sequence.start+i}</Text>
            </View>;
      })}
    </View>
    <Text style={styles.instruction}>
      {sequence.missingIndices.length===2?'すうじを えらんで、2つの □に いれてね':'すうじを ひとつ えらんでね'}
    </Text>
    <View style={styles.options}>
      {sequence.options.map(value=><Pressable key={value}
        testID={'sequence-card-'+value}
        accessibilityRole="button"
        accessibilityLabel={value+' を '+(active+1)+'こめの □に いれる'}
        accessibilityState={{disabled}}
        disabled={disabled} onPress={()=>choose(value)}
        style={styles.card}>
        <Text style={styles.cardText}>{value}</Text>
      </Pressable>)}
    </View>
    <Pressable testID="sequence-answer-check" accessibilityRole="button"
      accessibilityLabel="こたえあわせ"
      accessibilityState={{disabled:disabled||!complete}}
      disabled={disabled||!complete}
      onPress={()=>onSubmit(filled.join('・'))}
      style={[styles.check,(!complete||disabled)&&styles.checkDisabled]}>
      <Text style={styles.checkText}>こたえあわせ</Text>
    </Pressable>
  </View>;
}

/** Draw the question's square instead of relying on a font-specific glyph
 * whose baseline makes the square look small and too low on many devices. */
export function PreschoolSequenceQuestion({question}:{question:string}){
  const square=question.indexOf('□');
  if(square<0)return <Text style={styles.questionPhrase}>{question}</Text>;
  return <View testID="preschool-sequence-question" accessible
      accessibilityLabel={question} style={styles.questionRow}>
    <Text accessible={false} style={styles.questionPhrase}>{question.slice(0,square)}</Text>
    <View testID="preschool-sequence-question-square" accessible={false} style={styles.questionSquare}/>
    <Text accessible={false} style={styles.questionPhrase}>{question.slice(square+1)}</Text>
  </View>;
}

const styles=StyleSheet.create({
  outer:{width:'100%',alignSelf:'center',maxWidth:480,alignItems:'center',gap:12,paddingTop:8},
  instruction:{color:'#fff2c7',fontSize:18,fontWeight:'900',textAlign:'center'},
  grid:{width:'100%',flexDirection:'row',flexWrap:'wrap',justifyContent:'center',gap:5},
  cell:{width:'18%',minWidth:0,minHeight:58,borderRadius:11,backgroundColor:'#fdf8e9',
    borderWidth:2,borderColor:'#d7bd87',justifyContent:'center',alignItems:'center'},
  blank:{backgroundColor:'#d9e9ff',borderColor:'#4e6cba'},
  active:{borderWidth:4,borderColor:'#e3a53d',backgroundColor:'#ffedbf'},
  cellText:{color:'#26345c',fontSize:28,fontWeight:'900'},
  // Draw a 30px square in the exact center of the touch tile.
  emptySquare:{width:30,height:30,borderWidth:3,borderColor:'#36559b',borderRadius:2},
  // Inline question square matches text size without font baseline offsets.
  questionRow:{width:'100%',flexDirection:'row',flexWrap:'wrap',alignItems:'center',columnGap:8,rowGap:4},
  questionPhrase:{color:'white',fontSize:29,fontWeight:'900',lineHeight:42},
  questionSquare:{width:29,height:29,borderWidth:3,borderColor:'white',borderRadius:2},
  options:{width:'100%',flexDirection:'row',justifyContent:'center',flexWrap:'wrap',gap:10},
  card:{minHeight:64,minWidth:66,paddingHorizontal:12,backgroundColor:'#fff0bb',
    borderColor:'#daa855',borderWidth:3,borderRadius:14,alignItems:'center',justifyContent:'center'},
  cardText:{fontSize:32,color:'#29345d',fontWeight:'900'},
  check:{width:'100%',minHeight:56,borderRadius:13,backgroundColor:'#e8b14d',
    alignItems:'center',justifyContent:'center'},
  checkDisabled:{opacity:0.45},
  checkText:{color:'#25375b',fontWeight:'900',fontSize:20},
});
