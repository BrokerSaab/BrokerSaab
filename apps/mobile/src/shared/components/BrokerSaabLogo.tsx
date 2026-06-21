import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors } from '../theme';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark'; // light = white text (on dark bg), dark = navy text (on light bg)
  showTagline?: boolean;
}

const ICON_SIZES = { sm: 24, md: 32, lg: 44 };
const FONT_SIZES = { sm: 16, md: 20, lg: 26 };

export const BrokerSaabLogo: React.FC<Props> = ({
  size = 'md',
  variant = 'light',
  showTagline = false,
}) => {
  const iconSize = ICON_SIZES[size];
  const fontSize = FONT_SIZES[size];
  const brokerColor = variant === 'light' ? Colors.white : Colors.navy[800];
  const taglineColor = variant === 'light' ? Colors.navy[200] : Colors.slate[500];

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Image
          source={require('../../../assets/logo-icon.png')}
          style={[styles.icon, { width: iconSize, height: iconSize }]}
          resizeMode="contain"
        />
        <Text style={[styles.broker, { fontSize, color: brokerColor }]}>Broker</Text>
        <Text style={[styles.saab, { fontSize }]}>Saab</Text>
      </View>
      {showTagline && (
        <Text style={[styles.tagline, { color: taglineColor }]}>
          TRUSTED ADVISORY PLATFORM
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  icon: {},
  broker: { fontWeight: '800', letterSpacing: 0.2 },
  saab: { fontWeight: '800', color: Colors.gold[500], letterSpacing: 0.2 },
  tagline: {
    fontSize: 8,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
});
