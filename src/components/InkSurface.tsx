import { useRef } from 'react';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';
import type { InkSurfaceProps } from './inkSurfaceProps';

export default function InkSurface({ children, label = 'てがきエリア', start, move, finish, cancel }: InkSurfaceProps) {
  const active = useRef<number | null>(null);
  const point = ({ nativeEvent }: GestureResponderEvent) => ({ x: nativeEvent.locationX, y: nativeEvent.locationY, time: nativeEvent.timestamp });
  return (
    <View style={StyleSheet.absoluteFill}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>{children}</View>
      <View accessible accessibilityLabel={label} style={StyleSheet.absoluteFill}
        onStartShouldSetResponder={() => true}
        onResponderGrant={event => {
          active.current = event.nativeEvent.identifier;
          start(point(event));
        }}
        onResponderMove={event => {
          if (event.nativeEvent.identifier === active.current) move(point(event));
        }}
        onResponderRelease={event => {
          if (event.nativeEvent.identifier === active.current) move(point(event));
          active.current = null;
          finish();
        }}
        onResponderTerminate={() => { active.current = null; cancel(); }}
        onResponderTerminationRequest={() => false}
      />
    </View>
  );
}
