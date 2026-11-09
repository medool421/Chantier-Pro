import React, { forwardRef } from 'react';
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

const ThemedTextInput = forwardRef(function ThemedTextInput(
  { placeholderTextColor, style, ...props },
  ref
) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const theme = inputColors[scheme];

  return (
    <TextInput
      ref={ref}
      {...props}
      style={style}
      placeholderTextColor={placeholderTextColor || theme.placeholder}
    />
  );
});

export default ThemedTextInput;
