import type { WorldMapViewportProps } from './WorldMapViewport';

// Use browser-native overflow instead of React Native Web's horizontal
// ScrollView, whose touch-action can block the ancestor's vertical panning.
export function WorldMapViewport({zoomed,imageWidth,imageHeight,children}:WorldMapViewportProps){
  if(!zoomed)return <div data-testid="world-map-fit" style={{width:imageWidth,height:imageHeight,touchAction:'pan-y pinch-zoom'}}>{children}</div>;
  return <div data-testid="world-map-zoom" style={{width:'100%',height:imageHeight,overflowX:'auto',overflowY:'hidden',touchAction:'pan-x pan-y pinch-zoom',WebkitOverflowScrolling:'touch'}}>
    <div style={{width:imageWidth,height:imageHeight}}>{children}</div>
  </div>;
}
