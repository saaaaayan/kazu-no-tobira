import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

export type WorldMapViewportProps={zoomed:boolean;imageWidth:number;imageHeight:number;children:ReactNode};

// Never nest a disabled horizontal ScrollView inside the vertical page.
export function WorldMapViewport({zoomed,imageWidth,imageHeight,children}:WorldMapViewportProps){
  if(!zoomed)return <View style={{width:imageWidth,height:imageHeight}}>{children}</View>;
  return <ScrollView horizontal nestedScrollEnabled directionalLockEnabled
    showsHorizontalScrollIndicator contentContainerStyle={{width:imageWidth,height:imageHeight}}
    style={{height:imageHeight}}>{children}</ScrollView>;
}
