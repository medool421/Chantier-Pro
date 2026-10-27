import React from 'react';
import { TextInput, useColorScheme } from 'react-native';
import { colors } from '../theme/colors';

const inputColors = {
  light: {
    placeholder: colors.textMuted,
  },
  dark: {
    placeholder: '#a9b5c6',
  },
};

export default function ThemedTextInput({
  placeholderTextColor,
  style,
  ...props
}) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const theme = inputColors[scheme];

  return (
    <TextInput
      {...props}
      style={style}
      placeholderTextColor={placeholderTextColor || theme.placeholder}
    />
  );
}
