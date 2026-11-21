import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ui=readFileSync(new URL('../src/components/WorldScenes780.tsx',import.meta.url),'utf8');

test('all three preschool area headings have small text-only frames, not giant full-width panels',()=>{
 assert.match(ui,/\{row:0,title:stageLabels\.normal,count:50,kind:'normal'\}/);
 assert.match(ui,/\{row:10,title:stageLabels\.extra,count:10,kind:'extra'\}/);
 assert.match(ui,/\{row:12,title:stageLabels\.secret,count:5,kind:'secret'\}/);
 assert.match(ui,/testID=\{'island-area-'\+area\.kind\}/);
 assert.match(ui,/standardPixelMap&&styles.pixelZoneLabel/);
 assert.match(ui,/!standardPixelMap&&area.kind==='extra'&&styles.extraAreaLabel/);
 assert.match(ui,/!standardPixelMap&&area.kind==='secret'&&styles.secretAreaLabel/);
 assert.match(ui,/pixelZoneLabel:\{borderRadius:0,backgroundColor:'transparent',borderWidth:0/);
 assert.match(ui,/pixelZoneName:\{color:'#283e55',fontSize:15,lineHeight:21/);
 assert.match(ui,/backgroundColor:'rgba\(247,239,214,0\.96\)'/);
 assert.match(ui,/borderWidth:1,borderColor:'#849d81',borderRadius:4/);
 assert.match(ui,/top:y-\(standardPixelMap\?68:60\)/);
});
test('65 stage-title frames wrap just the words and sit below the stage pins',()=>{
 assert.match(ui,/standardPixelMap && grade.stages.map/);
 assert.match(ui,/testID=\{\(grade.id==='preschool'\?'preschool-stage-topic-':'toy-stage-topic-'\)\+String\(index\+1\)\}/);
 assert.match(ui,/onPress=\{\(\)=>setDetailStageId\(stage.id\)\}/);
 assert.match(ui,/numberOfLines=\{compactStageMap\?3:2\}/);
 assert.match(ui,/const labelLayout=preschoolStageLabelLayout\(actual,position,marker\)/);
 assert.match(ui,/style=\{\[styles\.preschoolStageTopic,labelLayout\]\}/);
 assert.match(ui,/preschoolStageTopic:\{position:'absolute',paddingHorizontal:0,paddingVertical:0/);
 assert.match(ui,/backgroundColor:'transparent',borderWidth:0/);
 assert.match(ui,/preschoolStageTopicText:\{fontSize:12,lineHeight:16/);
 assert.match(ui,/backgroundColor:'rgba\(247,241,219,0\.95\)',borderWidth:1,borderColor:'#8d9f86'/);
 assert.match(ui,/preschoolStageTopicSmall:\{fontSize:10,lineHeight:14\}/);
 assert.match(ui,/borderRadius:3,paddingHorizontal:2,paddingVertical:2,overflow:'hidden'/);
 assert.match(ui,/testID=\{grade.id==='preschool'\?'preschool-stage-info-card':'toy-stage-info-card'\}/);
});
test('the regular other-island zone labels remain unchanged',()=>{
 assert.match(ui,/zoneLabel:\{position:'absolute',paddingVertical:5,paddingHorizontal:9,backgroundColor:'#fff8dd'/);
 assert.match(ui,/extraAreaLabel:\{backgroundColor:'#e0eae5',borderColor:'#90b4a8'\}/);
 assert.match(ui,/secretAreaLabel:\{backgroundColor:'#eee2e9',borderColor:'#b39aaa'\}/);
});
