// Minimal monochrome login in two steps: leaders enter their e-mail, receive a
// 6-digit code by e-mail (Supabase OTP), then type it in. No password — the
// session persists in secure storage after the code is verified. Validation
// errors render inline, attached to the offending field.
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OTP_CODE_LENGTH, OTP_RESEND_COOLDOWN_SECONDS } from '@/lib/config';
import { useTheme } from '@/theme';

import { isCompleteOtpCode, sanitizeOtpInput } from './otp';
import { useSession } from './SessionProvider';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = 'email' | 'code';

export function LoginScreen() {
  const theme = useTheme();
  const { requestOtp, verifyOtp } = useSession();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const codeInputRef = useRef<TextInput>(null);

  // Resend cooldown countdown: tick every second while it's running.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const trimmedEmail = email.trim();
  const emailValid = EMAIL_PATTERN.test(trimmedEmail);
  const canSend = trimmedEmail.length > 0 && !submitting;
  const canVerify = isCompleteOtpCode(code) && !submitting;

  async function handleSend() {
    if (submitting) return;
    setAuthError(null);
    if (!emailValid) {
      setFieldError('E-mail inválido — confira se digitou certo (ex.: nome@dominio.com).');
      return;
    }
    setFieldError(null);
    setSubmitting(true);
    const { error } = await requestOtp(trimmedEmail);
    setSubmitting(false);
    if (error) {
      setAuthError(error);
      return;
    }
    setCode('');
    setStep('code');
    setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
    // Give the layout a frame to mount the code field before focusing it.
    requestAnimationFrame(() => codeInputRef.current?.focus());
  }

  async function handleVerify() {
    if (submitting) return;
    setAuthError(null);
    if (!isCompleteOtpCode(code)) {
      setFieldError(`Digite os ${OTP_CODE_LENGTH} dígitos do código.`);
      return;
    }
    setFieldError(null);
    setSubmitting(true);
    const { error } = await verifyOtp(trimmedEmail, code);
    if (error) {
      setAuthError(error);
      setSubmitting(false);
    }
    // On success the root layout swaps to the (app) group (session change).
  }

  async function handleResend() {
    if (cooldown > 0 || submitting) return;
    setAuthError(null);
    setFieldError(null);
    setSubmitting(true);
    const { error } = await requestOtp(trimmedEmail);
    setSubmitting(false);
    if (error) {
      setAuthError(error);
      return;
    }
    setCode('');
    setCooldown(OTP_RESEND_COOLDOWN_SECONDS);
  }

  function handleChangeEmail() {
    setStep('email');
    setCode('');
    setFieldError(null);
    setAuthError(null);
    setCooldown(0);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Bem-vindo</Text>
          <Text style={[styles.subtitle, { color: theme.colors.secondaryText }]}>
            {step === 'email'
              ? 'Entre com seu e-mail'
              : `Enviamos um código para ${trimmedEmail}`}
          </Text>
        </View>

        <View style={[styles.form, { backgroundColor: theme.colors.input }]}>
          {step === 'email' ? (
            <View style={styles.fieldRow}>
              <TextInput
                style={[styles.field, { color: theme.colors.text }]}
                placeholder="E-mail"
                placeholderTextColor={theme.colors.tertiaryText}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (fieldError) setFieldError(null);
                  if (authError) setAuthError(null);
                }}
                returnKeyType="go"
                onSubmitEditing={handleSend}
              />
            </View>
          ) : (
            <View style={styles.fieldRow}>
              <TextInput
                ref={codeInputRef}
                style={[styles.field, styles.codeField, { color: theme.colors.text }]}
                placeholder={'0'.repeat(OTP_CODE_LENGTH)}
                placeholderTextColor={theme.colors.tertiaryText}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={OTP_CODE_LENGTH}
                value={code}
                onChangeText={(value) => {
                  setCode(sanitizeOtpInput(value));
                  if (fieldError) setFieldError(null);
                  if (authError) setAuthError(null);
                }}
                returnKeyType="go"
                onSubmitEditing={handleVerify}
              />
            </View>
          )}
          {fieldError ? (
            <Text style={[styles.fieldError, { color: theme.colors.danger }]}>{fieldError}</Text>
          ) : null}
        </View>

        {authError ? (
          <Text style={[styles.authError, { color: theme.colors.danger }]}>{authError}</Text>
        ) : null}

        <Pressable
          style={[
            styles.button,
            {
              backgroundColor: theme.colors.text,
              opacity: (step === 'email' ? canSend : canVerify) ? 1 : 0.4,
            },
          ]}
          onPress={step === 'email' ? handleSend : handleVerify}
          disabled={step === 'email' ? !canSend : !canVerify}
        >
          {submitting ? (
            <ActivityIndicator color={theme.colors.background} />
          ) : (
            <Text style={[styles.buttonLabel, { color: theme.colors.background }]}>
              {step === 'email' ? 'Enviar código' : 'Entrar'}
            </Text>
          )}
        </Pressable>

        {step === 'code' ? (
          <View style={styles.actions}>
            <Pressable
              onPress={handleResend}
              disabled={cooldown > 0 || submitting}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.link,
                  { color: cooldown > 0 ? theme.colors.tertiaryText : theme.colors.secondaryText },
                ]}
              >
                {cooldown > 0 ? `Reenviar código em ${cooldown}s` : 'Reenviar código'}
              </Text>
            </Pressable>
            <Pressable onPress={handleChangeEmail} hitSlop={8} accessibilityRole="button">
              <Text style={[styles.link, { color: theme.colors.secondaryText }]}>Trocar e-mail</Text>
            </Pressable>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  form: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    gap: 10,
  },
  field: {
    flex: 1,
    fontSize: 17,
    // Explicit: without it the email field renders with huge tracking on some devices.
    letterSpacing: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  codeField: {
    fontSize: 22,
    letterSpacing: 8,
    fontVariant: ['tabular-nums'],
  },
  fieldError: {
    fontSize: 13,
    paddingHorizontal: 16,
    paddingBottom: 12,
    marginTop: -4,
  },
  authError: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  button: {
    marginTop: 24,
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontSize: 17,
    fontWeight: '600',
  },
  actions: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  link: {
    fontSize: 15,
    fontWeight: '500',
  },
});
