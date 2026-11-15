import { Pressable, StyleSheet, Text, View } from 'react-native';

const rows = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['けす', '0', '全部消す']];

export default function NumberPad({ disabled, onChange }: {
  disabled: boolean;
  onChange: (key: string) => void;
}) {
  return (
    <View style={styles.pad}>
      {rows.map(row => (
        <View key={row[0]} style={styles.row}>
          {row.map(key => {
            const digit = key.length === 1;
            return (
              <Pressable key={key} accessibilityRole="button" disabled={disabled}
                accessibilityState={{ disabled }}
                accessibilityLabel={key === 'けす' ? '1文字削除' : digit ? key : 'こたえを全部消す'}
                onPress={() => onChange(key)}
                style={({ pressed }) => [styles.key, !digit && styles.edit, (pressed || disabled) && styles.dim]}>
                <Text style={[styles.label, !digit && styles.editLabel]}>{key}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { gap: 6 },
  row: { flexDirection: 'row', gap: 6 },
  key: { flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: '#e8ecfa' },
  edit: { backgroundColor: '#eeebf7' },
  label: { color: '#232b56', fontSize: 22, fontWeight: '700' },
  editLabel: { fontSize: 12 },
  dim: { opacity: 0.6 },
});
