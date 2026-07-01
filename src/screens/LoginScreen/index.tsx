import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { Colors, Spacing, Radius } from '../../theme';
import { FText } from '../../components/common/FText';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    const trimEmail = email.trim();
    if (!trimEmail || !password) {
      setError('이메일과 비밀번호를 입력하세요.');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error: e } = await supabase.auth.signInWithPassword({
          email: trimEmail,
          password,
        });
        if (e) throw e;
      } else {
        const { error: e } = await supabase.auth.signUp({
          email: trimEmail,
          password,
        });
        if (e) throw e;
        Alert.alert(
          '가입 완료',
          '이메일 인증 링크를 확인하세요. 인증 후 로그인할 수 있습니다.',
        );
      }
    } catch (e: any) {
      const msg: string = e?.message ?? '오류가 발생했습니다.';
      if (msg.includes('Invalid login credentials')) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      } else if (msg.includes('already registered')) {
        setError('이미 가입된 이메일입니다. 로그인을 시도하세요.');
      } else if (msg.includes('Email not confirmed')) {
        setError('이메일 인증이 필요합니다. 받은 편지함을 확인하세요.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: Colors.bg.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" />

      <View style={[styles.inner, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <FText variant="label" color={Colors.accent.primary}>FOCUS CAPITAL</FText>
          </View>
          <FText variant="h1" color={Colors.text.primary} style={styles.title}>
            {mode === 'signin' ? '집중 자산\n관리 시작' : '계좌 개설'}
          </FText>
          <FText variant="bodySmall" color={Colors.text.tertiary} style={styles.subtitle}>
            {mode === 'signin'
              ? '이메일과 비밀번호로 로그인하세요'
              : '새 계정을 만들어 집중력을 관리하세요'}
          </FText>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <FText variant="label" color={Colors.text.tertiary} style={styles.fieldLabel}>
              이메일
            </FText>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              placeholderTextColor={Colors.text.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.fieldGroup}>
            <FText variant="label" color={Colors.text.tertiary} style={styles.fieldLabel}>
              비밀번호
            </FText>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={mode === 'signup' ? '6자 이상' : '••••••••'}
              placeholderTextColor={Colors.text.muted}
              secureTextEntry
              editable={!loading}
            />
          </View>

          {error && (
            <View style={styles.errorBox}>
              <FText variant="numXs" color={Colors.market.bearish}>{error}</FText>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.bg.primary} size="small" />
            ) : (
              <FText variant="bodyMedium" color={Colors.bg.primary}>
                {mode === 'signin' ? '로그인' : '계정 만들기'}
              </FText>
            )}
          </TouchableOpacity>
        </View>

        {/* Toggle mode */}
        <TouchableOpacity
          style={styles.toggleRow}
          onPress={() => { setMode(m => m === 'signin' ? 'signup' : 'signin'); setError(null); }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <FText variant="bodySmall" color={Colors.text.tertiary}>
            {mode === 'signin' ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
          </FText>
          <FText variant="bodySmall" color={Colors.accent.primary}>
            {mode === 'signin' ? '회원가입' : '로그인'}
          </FText>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    justifyContent: 'space-between',
  },
  header: {
    gap: Spacing.sm,
  },
  logoBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.accent.primary + '40',
    backgroundColor: Colors.accent.primary + '10',
    marginBottom: Spacing.xs,
  },
  title: {
    lineHeight: 38,
  },
  subtitle: {
    lineHeight: 20,
  },
  form: {
    gap: Spacing.md,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    marginLeft: 2,
  },
  input: {
    backgroundColor: Colors.bg.card,
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.base,
    color: Colors.text.primary,
    fontSize: 15,
    fontFamily: 'System',
  },
  errorBox: {
    backgroundColor: Colors.market.bearishGlow,
    borderWidth: 1,
    borderColor: Colors.market.bearish + '30',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  submitBtn: {
    backgroundColor: Colors.accent.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
    minHeight: 52,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});