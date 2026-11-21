import type {IslandSpriteId} from './islandPixelSprites.ts';
import type {StandardPixelIslandId} from './standardPixelIslandMap.ts';

export type GroundPattern =
  | 'stitches'|'patchwork'|'buttons'|'woven'
  | 'rails'|'blocks'|'woodgrain'|'playmat'
  | 'river'|'grass'|'roots'|'leaves'
  | 'wafer'|'chocolateTiles'|'icing'|'crumbs'
  | 'lavaFlow'|'strata'|'fossilBed'|'crackedEarth'
  | 'metalPlates'|'pipelines'|'circuit'|'rivets'
  | 'sandstone'|'mosaicTiles'|'sandRipples'|'hieroglyphs'
  | 'stoneMaze'|'stoneTiles'|'mortar'|'gravel'
  | 'mirrorTiles'|'glassTiles'|'diamondTiles'|'reflection'
  | 'lightField'|'shadowField'|'prismTiles'|'moonTiles'
  | 'starChart'|'orbitChart'|'starGrid'|'nightTiles'
  | 'lake'|'forestFloor'|'mountainRidges'|'meadow'
  | 'forestGlade'|'forestGrove'|'forestGrass'|'forestLeafLitter'
  | 'prehistoricLava'|'prehistoricFossils'|'prehistoricFernBed'|'prehistoricRocks'
  | 'courtyard'|'libraryTiles'|'compassRose'|'paving'
  | 'magicCircle'|'runes'|'alchemyTiles'|'violetStone'
  | 'fortress'|'copperTiles'|'cobblestones'|'battlements'
  | 'orbits'|'craters'|'nebula'|'baseTiles';
export type IslandArtSet = {
  large:readonly IslandSpriteId[];
  medium:readonly IslandSpriteId[];
  small:readonly IslandSpriteId[];
  ground:readonly GroundPattern[];
};

export const ISLAND_ART_SETS = {
  preschool:{
    large:['bear','rabbit','squirrel'],medium:['cushion','ribbon','spool','nest','mouse','bird','blocks'],
    small:['paw','button','patch','leaf','flowers','acorn','ball','star'],
    ground:['stitches','patchwork','buttons','woven'],
  },
  e1:{
    large:['robot','train','cottage'],medium:['car','boat','drum','blocks','top','kendama','puzzle'],
    small:['ball','rail','button','nut','spring','flag','crown','star'],
    ground:['rails','blocks','woodgrain','playmat'],
  },
  e2:{
    large:['forestBear','forestRabbit','forestFox','forestDeer'],
    medium:['forestSquirrel','forestOwl','forestRaccoon','forestBird',
      'forestTree','forestStump','forestMushroom','forestGrass'],
    small:['forestTracks','forestAcorn','forestLeaves','forestFlowers',
      'forestTwigs','forestBerries','forestFeather','forestTinyMushrooms'],
    ground:['forestGlade','forestGrove','forestGrass','forestLeafLitter'],
  },
  e3:{
    large:['sweetHouse','cake','parfait'],medium:['donut','pudding','macaron','icecream','cupcake','chocolate','lollipop'],
    small:['candy','cookie','biscuit','cherry','sugar','spoon','ribbon','star'],
    ground:['wafer','chocolateTiles','icing','crumbs'],
  },
  e4:{
    large:['prehistoricRex','prehistoricTriceratops','prehistoricPterosaur',
      'prehistoricLongneck','prehistoricStegosaurus','prehistoricVolcano'],
    medium:['prehistoricEggs','prehistoricBone','prehistoricSkeleton','prehistoricAmmonite',
      'prehistoricRockRidge','prehistoricFern','prehistoricPalm','prehistoricLavaCrack'],
    small:['prehistoricTracks','prehistoricPebbles','prehistoricFossilShard','prehistoricBoneChips',
      'prehistoricAsh','prehistoricGroundCrack','prehistoricLeaves','prehistoricSprout'],
    ground:['prehistoricLava','prehistoricFossils','prehistoricFernBed','prehistoricRocks'],
  },
  e5:{
    large:['factory','gear','engine'],medium:['robot','arm','conveyor','pipe','meter','valve','piston'],
    small:['bolt','nut','spring','switch','chain','lock','brick','flag'],
    ground:['metalPlates','pipelines','circuit','rivets'],
  },
  e6:{
    large:['temple','pyramid','gate'],medium:['statue','column','obelisk','altar','mosaic','tablet','amphora'],
    small:['scarab','shard','scroll','torch','brick','rock','compass','key'],
    ground:['sandstone','mosaicTiles','sandRipples','hieroglyphs'],
  },
  j1:{
    large:['gate','portcullis','statue'],medium:['maze','stairs','chest','column','arch','wall','tower'],
    small:['key','torch','lock','chain','brick','skull','shield','compass'],
    ground:['stoneMaze','stoneTiles','mortar','gravel'],
  },
  j2:{
    large:['crystalTower','mirror','arch'],medium:['crystal','glass','gem','diamond','column','gate','statue'],
    small:['prism','star','moon','compass','shard','tablet','lantern','mosaic'],
    ground:['mirrorTiles','glassTiles','diamondTiles','reflection'],
  },
  j3:{
    large:['lightTower','shadowTower','shadowTree'],medium:['prism','sundial','sun','moon','lantern','gate','obelisk'],
    small:['potion','star','crystal','glass','shard','key','leaf','torch'],
    ground:['lightField','shadowField','prismTiles','moonTiles'],
  },
  h1:{
    large:['observatory','telescope','astrolabe'],medium:['chart','planet','moon','comet','compass','tower','globe'],
    small:['star','constellation','scroll','quill','tablet','gem','antenna','book'],
    ground:['starChart','orbitChart','starGrid','nightTiles'],
  },
  h2:{
    large:['mountain','waterfall','tree'],medium:['pine','bridge','cliff','cottage','windmill','palm','log'],
    small:['fern','flowers','rock','leaf','mushroom','bird','cloud','acorn'],
    ground:['lake','forestFloor','mountainRidges','meadow'],
  },
  h3:{
    large:['school','library','clockTower'],medium:['gate','globe','blackboard','statue','column','observatory','book'],
    small:['compass','quill','inkpot','scroll','chart','lantern','tablet','mosaic'],
    ground:['courtyard','libraryTiles','compassRose','paving'],
  },
  sage:{
    large:['tower','gate','cauldron'],medium:['spellbook','crystal','hat','flask','broom','mirror','altar'],
    small:['wand','rune','potion','scroll','star','key','lantern','gem'],
    ground:['magicCircle','runes','alchemyTiles','violetStone'],
  },
  champion:{
    large:['castle','gate','throne'],medium:['wall','tower','carriage','statue','bridge','portcullis','shield'],
    small:['crown','flag','sword','helmet','key','torch','brick','chain'],
    ground:['fortress','copperTiles','cobblestones','battlements'],
  },
  cosmos:{
    large:['station','rocket','base'],medium:['planet','ufo','satellite','antenna','capsule','observatory','meteor'],
    small:['crater','moon','comet','star','gem','meter','chart','bolt'],
    ground:['orbits','craters','nebula','baseTiles'],
  },
} as const satisfies Record<StandardPixelIslandId,IslandArtSet>;
