import type { MathQuestion } from './worldQuestions.ts';

type Point = readonly [number, number];
export type StudyFigure = {
  outline: readonly (readonly Point[])[];
  lines: readonly { from: Point; to: Point; dashed?: boolean }[];
  labels: readonly { at: Point; text: string }[];
  circle?: { center: Point; radius: number };
  description: string;
};
type Draft = Omit<MathQuestion, 'id' | 'skillId'>;

function draft(question: string, answer: number, figure: StudyFigure, hints: readonly [string,string,string], explanation: string): Draft {
  return { type:'number', prompt:'こたえを 数字で いれてね', question, answer:String(Math.round(answer*10000)/10000),
    hint:hints[0], guidedHints:hints, figure, explanation };
}

const label = (x:number,y:number,text:string) => ({at:[x,y] as Point,text});
const line = (from:Point,to:Point,dashed=false) => ({from,to,dashed});

export function gradeFiveVisualProblem(family:string, index:number, n:(a:number,b:number)=>number): Draft | undefined {
  if (family==='area') {
    const mode=index%3, base=n(6,16), height=n(3,10), top=n(3,base-2);
    const k=Math.min(200/(base+2),103/height), x=55, y=141, right=x+base*k, upper=y-height*k;
    const points:readonly Point[]=mode===0?[[x,y],[right,y],[x+base*k*.36,upper]]:mode===1?
      [[x,y],[right,y],[right+2*k,upper],[x+2*k,upper]]:[[x,y],[right,y],[x+(top+1)*k,upper],[x+k,upper]];
    const perpendicular=points[points.length-1][0];
    const name=['三角形','平行四辺形','台形'][mode];
    const condition=mode===2?'上底 '+top+' cm、下底 '+base+' cm':'底辺 '+base+' cm';
    const figure:StudyFigure={outline:[points],
      lines:[line([perpendicular,upper],[perpendicular,y],true),line([perpendicular,y-9],[perpendicular+9,y-9]),line([perpendicular+9,y-9],[perpendicular+9,y])],
      labels:[label((x+right)/2,166,base+' cm'),label(perpendicular-26,(upper+y)/2,height+' cm'),
        ...(mode===2?[label(x+(top/2+1)*k,upper-11,top+' cm')]:[])],
      description:name+'。'+condition+'、高さ '+height+' cm。点線が底辺に直角に交わる。'};
    return draft('図の'+name+'の面積を求めましょう。'+condition+'、高さ '+height+' cmです。（cm²）',
      mode===0?base*height/2:mode===1?base*height:(base+top)*height/2,figure,
      ['点線は底辺に直角です。ななめの辺ではなく、この点線の長さを高さに使います。',
        mode===0?'同じ三角形をもう1枚合わせると、同じ底辺と高さの平行四辺形になります。':mode===1?'左端の三角形を切って右に移すと、面積が同じ長方形になります。':'同じ台形をもう1枚逆向きに合わせます。できる平行四辺形の底辺は上底と下底の和です。',
        mode===0?base+'×'+height+'で2枚分を求め、2で割ります。':mode===1?base+'×'+height+'で長方形の面積を求めます。':'('+top+'＋'+base+')×'+height+'で2枚分を求め、2で割ります。'],
      mode===0?base+'×'+height+'＝'+(base*height)+' cm²は同じ三角形2枚分。1枚は '+(base*height/2)+' cm²です。':
        mode===1?'三角形を移しても面積は変わりません。'+base+'×'+height+'＝'+(base*height)+' cm²です。':
        '合わせた平行四辺形の底辺は '+(base+top)+' cmです。('+top+'＋'+base+')×'+height+'÷2＝'+((top+base)*height/2)+' cm²です。');
  }

  if (family==='volume') {
    const width=n(3,10), depth=n(2,8), height=n(2,8), missing=index%2===1, volume=width*depth*height;
    const w=width*13, h=height*11, dx=depth*6, dy=depth*5;
    const a:Point=[63,151], b:Point=[63+w,151], c:Point=[63+w,151-h], d:Point=[63,151-h];
    const e:Point=[63+dx,151-h-dy], f:Point=[63+w+dx,151-h-dy], g:Point=[63+w+dx,151-dy];
    const figure:StudyFigure={outline:[[a,b,c,d],[d,e,f,c],[c,f,g,b]],lines:[],
      labels:[label((a[0]+b[0])/2,173,width+' cm'),label(g[0]+16,(g[1]+b[1])/2+8,depth+' cm'),
        label(32,151-h/2,missing?'？ cm':height+' cm')],
      description:'直方体の見取り図。横 '+width+' cm、奥行き '+depth+' cm、'+(missing?'高さは不明、体積 '+volume+' cm³。':'高さ '+height+' cm。')};
    return draft(missing?'図の直方体は横 '+width+' cm、奥行き '+depth+' cm、体積 '+volume+' cm³です。高さは何 cmですか？':
      '図の直方体は横 '+width+' cm、奥行き '+depth+' cm、高さ '+height+' cmです。体積は何 cm³ですか？',
      missing?height:volume,figure,['まず一番下の面に、1 cm³の立方体が1段に何個並ぶかを考えます。',
        '底面積は '+width+'×'+depth+' cm²。高さ1 cmの1段分の体積と、段の数の関係を使います。',
        missing?volume+'÷('+width+'×'+depth+')で段の数を求めます。':width+'×'+depth+'×'+height+'で全部の段を合わせます。'],
      missing?'1段は '+(width*depth)+' cm³。'+volume+'÷'+(width*depth)+'＝'+height+'。1段は1 cmなので高さは '+height+' cmです。':
        '1段は '+(width*depth)+' cm³。'+height+'段あるので、'+(width*depth)+'×'+height+'＝'+volume+' cm³です。');
  }

  if (family==='circle') {
    const radius=n(2,20), mode=index%3, diameter=radius*2, perimeter=diameter*3.14;
    const measure=mode===0?radius:diameter, name=mode===0?'半径':'直径';
    const figure:StudyFigure={outline:[],circle:{center:[158,91],radius:59},
      lines:[line(mode===0?[158,91]:[99,91],[217,91])],
      labels:[label(158,177,mode===2?'円周 '+String(Math.round(perimeter*100)/100)+' cm':name+' '+measure+' cm')],
      description:'中心を示した円。'+(mode===2?'円周 '+String(Math.round(perimeter*100)/100)+' cm。直径は不明。':name+' '+measure+' cm。')};
    const shown=String(Math.round(perimeter*100)/100);
    return draft(mode===2?'図の円の円周は '+shown+' cmです。直径を求めましょう。（円周率は3.14）':
      '図の円の'+name+'は '+measure+' cmです。円周を求めましょう。（円周率は3.14、答えは cm）',
      mode===2?diameter:perimeter,figure,['直径は中心を通って円の両端を結ぶ長さです。半径は中心から円周までの長さです。',
        mode===0?'直径は半径の2倍。円周は直径の3.14倍です。':'円周と直径の関係は、円周＝直径×3.14です。',
        mode===2?shown+'÷3.14 で直径に戻します。':diameter+'×3.14 で円周を求めます。'],
      mode===2?shown+'÷3.14＝'+diameter+' cmです。'+diameter+'×3.14を計算すると元の円周に戻ります。':
        '直径は '+diameter+' cmです。'+diameter+'×3.14＝'+shown+' cmです。');
  }

  if (family==='geometry') {
    const a=n(3,12), b=n(2,9), missing=index%2===1;
    const k=Math.min(103/a,91/b), w=a*k, h=b*k;
    const A:Point=[57,139], B:Point=[57+w,139], C:Point=[57,139-h];
    const D:Point=[290,42], E:Point=[290-w,42], F:Point=[290,42+h];
    const figure:StudyFigure={outline:[[A,B,C],[D,E,F]],lines:[],
      labels:[label(A[0]-8,A[1]+17,'A'),label(B[0]+6,B[1]+17,'B'),label(C[0]-8,C[1]-8,'C'),
        label(D[0]+10,D[1]-8,'D'),label(E[0]-7,E[1]-8,'E'),label(F[0]+10,F[1]+12,'F'),
        label((A[0]+B[0])/2,176,a+' cm'),label((D[0]+E[0])/2,20,'重ねられる'),
        label(A[0]-25,(A[1]+C[1])/2,b+' cm')],
      description:'三角形ABCを回転すると三角形DEFに重なる。AとD、BとE、CとFが対応。ABは '+a+' cm、ACは '+b+' cm。'};
    return draft('図の三角形ABCとDEFは合同です。ABは '+a+' cm、ACは '+b+' cmです。'+(missing?'辺DF':'辺DE')+'の長さは何 cmですか？',
      missing?b:a,figure,['三角形ABCとDEFは、向きを変えるとぴったり重なります。',
        missing?'Dと重なる頂点はA、Fと重なる頂点はCです。':'Dと重なる頂点はA、Eと重なる頂点はBです。',
        missing?'DFと同じ長さの辺ACを見つけます。':'DEと同じ長さの辺ABを見つけます。'],
      missing?'合同な図形の対応する辺の長さは等しいので、DF＝AC＝'+b+' cmです。':
        '合同な図形の対応する辺の長さは等しいので、DE＝AB＝'+a+' cmです。');
  }
}
