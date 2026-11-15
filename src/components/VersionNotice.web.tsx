import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BUILD_VERSION } from '../buildVersion';

type PublishedVersion = { version?: unknown };

export default function VersionNotice() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    async function checkForUpdate() {
      if (BUILD_VERSION === 'local-dev') return;
      try {
        const endpoint = new URL('version.json', new URL('.', window.location.href));
        endpoint.searchParams.set('check', String(Date.now()));
        const response = await fetch(endpoint.toString(), { cache: 'no-store' });
        if (!response.ok) return;
        const published = await response.json() as PublishedVersion;
        if (active && typeof published.version === 'string' && published.version !== BUILD_VERSION) {
          setUpdateAvailable(true);
        }
      } catch {
        // A transient connection error should never block children's math practice.
      }
    }

    const onFocus = () => { void checkForUpdate(); };
    const onVisible = () => { if (!document.hidden) void checkForUpdate(); };
    void checkForUpdate();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(onFocus, 60_000);
    return () => {
      active = false;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.version} accessibilityLabel={`アプリのバージョン ${BUILD_VERSION.slice(0, 7)}`}>
        バージョン {BUILD_VERSION.slice(0, 7)}
      </Text>
      {updateAvailable && (
        <Pressable accessibilityRole="button" accessibilityLabel="新しいバージョンに更新"
          onPress={() => window.location.reload()} style={styles.updateButton}>
          <Text style={styles.updateText}>あたらしい バージョンが あるよ！ こうしんする</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  version: { color: '#d9e4f9', fontSize: 11, fontWeight: '600' },
  updateButton: { backgroundColor: '#f2d48a', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, minHeight: 38, justifyContent: 'center' },
  updateText: { color: '#283653', fontSize: 13, fontWeight: '800' },
});
