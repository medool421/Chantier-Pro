import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Platform,
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Custom hook to standardize keyboard handling across all ChantierPro modals.
 * Supports bottom-sheet forms, searchable pickers, and centered dialogs on Android and iOS.
 *
 * @param {Object} options
 * @param {boolean} options.isVisible Whether the modal is currently open.
 * @param {number} [options.bottomSheetRatio=0.85] Default max height ratio when keyboard is closed.
 * @param {number} [options.minHeight=260] Minimum height when keyboard is open.
 * @param {number} [options.extraBottomMargin=12] Bottom margin used when scrolling to focused fields.
 */
export function useKeyboardAwareModal({
  isVisible = false,
  bottomSheetRatio = 0.85,
  minHeight = 260,
  extraBottomMargin = 12,
} = {}) {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const scrollViewRef = useRef(null);
  const scrollViewHeightRef = useRef(0);
  const currentScrollY = useRef(0);
  const fieldLayouts = useRef({});
  const focusedFieldRef = useRef(null);
  const keyboardHeightRef = useRef(0);

  // Dynamic available height for bottom sheets when keyboard opens
  const availableModalHeight = keyboardHeight > 0
    ? Math.max(minHeight, windowHeight - keyboardHeight - Math.max(insets.top, 24) - 16)
    : Math.round(windowHeight * bottomSheetRatio);

  // Android keyboard elevation style (elevates bottom sheets or centered dialogs above keyboard)
  const modalKeyboardStyle = Platform.OS === 'android' && keyboardHeight > 0
    ? { paddingBottom: keyboardHeight }
    : undefined;

  // Viewport-relative delta scrolling: only scrolls if field is actually obscured
  const ensureFieldVisible = useCallback((fieldKey) => {
    const key = fieldKey || focusedFieldRef.current;
    if (!scrollViewRef.current || !key) return;

    const layout = fieldLayouts.current[key];
    if (!layout || typeof layout.y !== 'number') return;

    const visibleHeight = scrollViewHeightRef.current;
    if (visibleHeight <= 0) return;

    const fieldTop = layout.y;
    const fieldHeight = layout.height || 60;
    const fieldBottom = fieldTop + fieldHeight + extraBottomMargin;

    const currentScroll = currentScrollY.current;
    const currentVisibleBottom = currentScroll + visibleHeight;
    const currentVisibleTop = currentScroll;

    if (fieldBottom > currentVisibleBottom) {
      const targetY = fieldBottom - visibleHeight;
      scrollViewRef.current.scrollTo({ y: Math.max(0, targetY), animated: true });
    } else if (fieldTop < currentVisibleTop) {
      const targetY = Math.max(0, fieldTop - 8);
      scrollViewRef.current.scrollTo({ y: targetY, animated: true });
    }
  }, [extraBottomMargin]);

  const handleFieldFocus = useCallback((fieldKey) => {
    focusedFieldRef.current = fieldKey;
    ensureFieldVisible(fieldKey);
  }, [ensureFieldVisible]);

  const handleFieldBlur = useCallback((fieldKey) => {
    if (focusedFieldRef.current === fieldKey) {
      focusedFieldRef.current = null;
    }
  }, []);

  const getFieldLayoutProps = useCallback((fieldKey) => ({
    onLayout: (e) => {
      fieldLayouts.current[fieldKey] = {
        y: e.nativeEvent.layout.y,
        height: e.nativeEvent.layout.height,
      };
    },
  }), []);

  const getScrollViewProps = useCallback(() => ({
    ref: scrollViewRef,
    keyboardShouldPersistTaps: 'handled',
    keyboardDismissMode: 'on-drag',
    showsVerticalScrollIndicator: false,
    onScroll: (e) => {
      currentScrollY.current = e.nativeEvent.contentOffset.y;
    },
    scrollEventThrottle: 16,
    onLayout: (e) => {
      scrollViewHeightRef.current = e.nativeEvent.layout.height;
      if (focusedFieldRef.current) {
        ensureFieldVisible(focusedFieldRef.current);
      }
    },
  }), [ensureFieldVisible]);

  // Clean dismissal and state reset
  const dismissAndReset = useCallback((onClose) => {
    Keyboard.dismiss();
    focusedFieldRef.current = null;
    fieldLayouts.current = {};
    currentScrollY.current = 0;
    setKeyboardHeight(0);
    keyboardHeightRef.current = 0;
    if (onClose) onClose();
  }, []);

  // Keyboard listener lifecycle tied strictly to isVisible
  useEffect(() => {
    if (!isVisible) {
      setKeyboardHeight(0);
      keyboardHeightRef.current = 0;
      focusedFieldRef.current = null;
      fieldLayouts.current = {};
      currentScrollY.current = 0;
      return;
    }

    const onKeyboardShow = (e) => {
      const height = e.endCoordinates ? e.endCoordinates.height : 0;
      keyboardHeightRef.current = height;
      setKeyboardHeight(height);
      if (focusedFieldRef.current) {
        requestAnimationFrame(() => {
          ensureFieldVisible(focusedFieldRef.current);
        });
      }
    };

    const onKeyboardHide = () => {
      keyboardHeightRef.current = 0;
      setKeyboardHeight(0);
    };

    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      onKeyboardShow
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      onKeyboardHide
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [isVisible, ensureFieldVisible]);

  return {
    keyboardHeight,
    availableModalHeight,
    modalKeyboardStyle,
    scrollViewRef,
    handleFieldFocus,
    handleFieldBlur,
    getFieldLayoutProps,
    getScrollViewProps,
    dismissAndReset,
    ensureFieldVisible,
  };
}

export default useKeyboardAwareModal;
