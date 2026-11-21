/** The first approved preschool map is the single shared geometry for ALL 16 islands.
 * Each island may vary its muted palette and pixel landmarks; changing stage
 * coordinates, labels, checkpoint sizes or map-first ordering is forbidden.
 */
export const STANDARD_PIXEL_ISLANDS={
  preschool:{title:"ぬいぐるみの島",grade:"就学前",symbol:"paws",art:"plush"},
  e1:{title:"おもちゃの島",grade:"小学1年生",symbol:"blocks",art:"toys"},
  e2:{title:"どうぶつの島",grade:"小学2年生",symbol:"leaf",art:"forest"},
  e3:{title:"おかしの島",grade:"小学3年生",symbol:"candy",art:"sweets"},
  e4:{title:"恐竜の島",grade:"小学4年生",symbol:"footprint",art:"prehistoric"},
  e5:{title:"機械の島",grade:"小学5年生",symbol:"gear",art:"machinery"},
  e6:{title:"古代の島",grade:"小学6年生",symbol:"column",art:"ruins"},
  j1:{title:"迷宮の島",grade:"中学1年生",symbol:"maze",art:"labyrinth"},
  j2:{title:"鏡の島",grade:"中学2年生",symbol:"mirror",art:"reflection"},
  j3:{title:"光と影の島",grade:"中学3年生",symbol:"prism",art:"twilight"},
  h1:{title:"星座の島",grade:"高校1年生",symbol:"star-map",art:"constellations"},
  h2:{title:"大自然の島",grade:"高校2年生",symbol:"mountain",art:"wilderness"},
  h3:{title:"アカデミーの島",grade:"高校3年生",symbol:"book",art:"academy"},
  sage:{title:"魔法使いの島",grade:"理系大学入試",symbol:"hat",art:"magic"},
  champion:{title:"王国",grade:"最難関入試・数学競技",symbol:"crown",art:"kingdom"},
  cosmos:{title:"宇宙の島",grade:"大学数学・探究",symbol:"planet",art:"cosmos"},
} as const;
export type StandardPixelIslandId=keyof typeof STANDARD_PIXEL_ISLANDS;
export function isStandardPixelIsland(id:string):id is StandardPixelIslandId {
  return Object.prototype.hasOwnProperty.call(STANDARD_PIXEL_ISLANDS,id);
}
export function standardPixelIslandConfig(id:string){
  return isStandardPixelIsland(id)?STANDARD_PIXEL_ISLANDS[id]:undefined;
}

/** Deliberately distinct calm palettes. Preschool and toy maps preserve their
 * established character; the toy island becomes warm sand/blue to stop all
 * islands looking uniformly yellow-green.
 */
export const ISLAND_PIXEL_PALETTES={
  preschool:{water:"#80adc4",land:"#a9cb83",bandA:"#b2d28e",bandB:"#aacb83",stripe:"#94bc77",ink:"#344454",shore:"#e9dfb6",path:"#efe0b3",pathBorder:"#506d5e",accent:"#9e856e",paper:"#f5edce",trialBand:"#aac4b8",legendBand:"#c5b5c4",motifs:["plush"]},
  e1:{water:"#7d9fba",land:"#d8c49e",bandA:"#dbc9aa",bandB:"#d3bf9b",stripe:"#c5ac85",ink:"#344454",shore:"#ebdcb9",path:"#f6e4c3",pathBorder:"#655e63",accent:"#b98076",paper:"#f4e8d3",trialBand:"#bcb3b5",legendBand:"#c6b5c5",motifs:["toys"]},
  e2:{water:"#6f9daa",land:"#91ad8e",bandA:"#9eba94",bandB:"#91ae8c",stripe:"#7e9d7c",ink:"#294c4a",shore:"#e7d8ba",path:"#f4e6c2",pathBorder:"#426a59",accent:"#a97c59",paper:"#e9ead6",trialBand:"#9ab3ad",legendBand:"#b1a0b6",motifs:["tree","rabbit","mushroom"]},
  e3:{water:"#9e9bc5",land:"#e5b8ac",bandA:"#ebc4b6",bandB:"#e0b3ac",stripe:"#d4a6a8",ink:"#563e58",shore:"#f7e4c9",path:"#fff0d1",pathBorder:"#99768d",accent:"#be796f",paper:"#f8e5db",trialBand:"#c5b0cf",legendBand:"#cfb3b8",motifs:["cupcake","candy","donut"]},
  e4:{water:"#849b97",land:"#c3a16f",bandA:"#cbb181",bandB:"#c19a6b",stripe:"#ab865d",ink:"#4e493e",shore:"#e8d5ad",path:"#f8e2ae",pathBorder:"#80664a",accent:"#647f66",paper:"#f3e3c5",trialBand:"#acaf8b",legendBand:"#b9a28e",motifs:["dinosaur","fossil","volcano"]},
  e5:{water:"#688b9c",land:"#a8b7bf",bandA:"#b8c2c7",bandB:"#a3afb9",stripe:"#96a8b4",ink:"#34485b",shore:"#d5dfe3",path:"#e9e4d1",pathBorder:"#55758d",accent:"#bc8a65",paper:"#e0e7e5",trialBand:"#9eafba",legendBand:"#b4b1c1",motifs:["gear","factory","robot"]},
  e6:{water:"#75aab0",land:"#cfb995",bandA:"#dbc7a4",bandB:"#ccb38e",stripe:"#bda078",ink:"#655a48",shore:"#f5e4bf",path:"#f3e4b8",pathBorder:"#987955",accent:"#699b96",paper:"#f4ead5",trialBand:"#b7b6a2",legendBand:"#c6b19f",motifs:["column","pyramid","amphora"]},
  j1:{water:"#68798c",land:"#9c95a8",bandA:"#aaa4b5",bandB:"#9891a8",stripe:"#847d98",ink:"#3a3d55",shore:"#dad6da",path:"#f2e7d2",pathBorder:"#706c85",accent:"#bc9b73",paper:"#e9e6ed",trialBand:"#8b9ca9",legendBand:"#b0a3b9",motifs:["maze","key","torch"]},
  j2:{water:"#7da8b0",land:"#b9c6d4",bandA:"#cbd7dc",bandB:"#b9c5d3",stripe:"#a8bacb",ink:"#385b70",shore:"#e2eaf0",path:"#f2f1e9",pathBorder:"#7197ae",accent:"#a38aa9",paper:"#eaf1f2",trialBand:"#aab6d2",legendBand:"#bbaec9",motifs:["mirror","gem","arch"]},
  j3:{water:"#566c8d",land:"#8e8399",bandA:"#9d90a4",bandB:"#897e97",stripe:"#756e86",ink:"#35384f",shore:"#d8cbca",path:"#f3dfbc",pathBorder:"#5b567a",accent:"#cba67b",paper:"#e7e0db",trialBand:"#777d9f",legendBand:"#a48ca1",motifs:["lantern","prism","moon"]},
  h1:{water:"#425b80",land:"#7484a7",bandA:"#8293b3",bandB:"#6f809f",stripe:"#637395",ink:"#293c5d",shore:"#c9d1e3",path:"#efe6c6",pathBorder:"#445f87",accent:"#d7bc8a",paper:"#dde1e9",trialBand:"#7f7d9a",legendBand:"#9590a9",motifs:["constellation","telescope","planet"]},
  h2:{water:"#56899c",land:"#74977e",bandA:"#88a58b",bandB:"#759b81",stripe:"#638970",ink:"#304d55",shore:"#d0ded0",path:"#f3e4ba",pathBorder:"#48736c",accent:"#d5b487",paper:"#e4e9da",trialBand:"#829ca2",legendBand:"#9f9bae",motifs:["mountain","waterfall","pine"]},
  h3:{water:"#7498a5",land:"#c5c4bb",bandA:"#d2d2c8",bandB:"#c6c4b9",stripe:"#b1b3af",ink:"#405366",shore:"#ece6db",path:"#f4e7c7",pathBorder:"#74859b",accent:"#a6816b",paper:"#f2efe5",trialBand:"#b5c1c9",legendBand:"#c5b8c7",motifs:["book","column","compass"]},
  sage:{water:"#796788",land:"#a58faf",bandA:"#b19bbc",bandB:"#9d8aaa",stripe:"#907ba0",ink:"#4a3c5a",shore:"#e5d4df",path:"#f1e5c9",pathBorder:"#816f92",accent:"#bd9a75",paper:"#ece1e9",trialBand:"#a29eb6",legendBand:"#b29aad",motifs:["hat","spellbook","crystal"]},
  champion:{water:"#667f8d",land:"#b78e80",bandA:"#c9a192",bandB:"#b78f84",stripe:"#a88076",ink:"#523f4a",shore:"#ead1bd",path:"#f5e2bf",pathBorder:"#87615e",accent:"#c7a36b",paper:"#efe3d9",trialBand:"#aea3a4",legendBand:"#c2a2af",motifs:["castle","crown","shield"]},
  cosmos:{water:"#404966",land:"#777f9e",bandA:"#8790ac",bandB:"#7580a0",stripe:"#687494",ink:"#303950",shore:"#c3cde0",path:"#f1e8d9",pathBorder:"#5f6a91",accent:"#c8af92",paper:"#e1e5ec",trialBand:"#8487a7",legendBand:"#a099b6",motifs:["planet","satellite","rocket"]},
} as const;
export type IslandPixelPalette=(typeof ISLAND_PIXEL_PALETTES)[StandardPixelIslandId];
export function islandPixelPalette(id:string):IslandPixelPalette|undefined {
  return isStandardPixelIsland(id)?ISLAND_PIXEL_PALETTES[id]:undefined;
}
