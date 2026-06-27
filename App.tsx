import React, { useEffect, useRef } from 'react';
import { StatusBar, View, Animated, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FocusProvider, useFocus } from './src/store/focusStore';
import { AppNavigator } from './src/navigation';
import { Colors, Spacing } from './src/theme';
import { FText } from './src/components/common/FText';

function SessionBanner() {
  const { state } = useFocus();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-60)).current;
  const isActive = state.sessionState === 'active' || state.sessionState === 'paused';

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isActive ? 0 : -60,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isActive]);

  const elapsed = state.sessionElapsed;
  const duration = state.sessionDuration;
  const remaining = Math.max(0, duration - elapsed);
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const progress = duration > 0 ? elapsed / duration : 0;
  const isPaused = state.sessionState === 'paused';

  return (
    <Animated.View
      style={[
        styles.banner,
        { top: insets.top, transform: [{ translateY: slideAnim }] },
      ]}
      pointerEvents="none"
    >
      <View style={styles.bannerInner}>
        <View style={styles.bannerLeft}>
          <View style={[styles.dot, { backgroundColor: isPaused ? Colors.volatility : Colors.accent.primary }]} />
          <FText variant="numXs" color={Colors.text.primary}>
            {isPaused ? '일시정지' : '집중 투자 중'}
          </FText>
        </View>
        <FText variant="numSm" color={isPaused ? Colors.volatility : Colors.accent.primary}>
          {mm}:{ss}
        </FText>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
      </View>
    </Animated.View>
  );
}

function AppRoot() {
  return (
    <View style={{ flex: 1 }}>
      <AppNavigator />
      <SessionBanner />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <FocusProvider>
          <AppRoot />
        </FocusProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: Colors.bg.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent.primary + '40',
    zIndex: 999,
  },
  bannerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: 6,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  progressTrack: {
    height: 2,
    backgroundColor: Colors.border.subtle,
  },
  progressFill: {
    height: 2,
    backgroundColor: Colors.accent.primary,
  },
});
