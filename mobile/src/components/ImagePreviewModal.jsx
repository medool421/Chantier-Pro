import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { filesService, getReadableFileName } from '../api/files.service';

const MAX_ZOOM = 4;

function createGestureState() {
  return {
    mode: 'idle',
    touches: new Map(),
    pinchTouchIds: null,
    panTouchId: null,
    lastPanPoint: null,
    startDistance: 0,
    startZoom: 1,
    startOffset: { x: 0, y: 0 },
    startMidpoint: { x: 0, y: 0 },
  };
}

function getTouchList(touches) {
  return touches ? Array.from(touches) : [];
}

function toTouchPoint(touch) {
  if (touch?.identifier === undefined || !Number.isFinite(touch.pageX) || !Number.isFinite(touch.pageY)) {
    return null;
  }

  return {
    identifier: touch.identifier,
    pageX: touch.pageX,
    pageY: touch.pageY,
  };
}

function getDistance(first, second) {
  const dx = first.pageX - second.pageX;
  const dy = first.pageY - second.pageY;
  return Math.sqrt((dx * dx) + (dy * dy));
}

function getMidpoint(first, second) {
  return {
    x: (first.pageX + second.pageX) / 2,
    y: (first.pageY + second.pageY) / 2,
  };
}

function isGalleryImage(file) {
  const mimeType = file?.mimeType?.toLowerCase();
  if (mimeType) {
    return mimeType === 'image/jpeg' || mimeType === 'image/jpg' || mimeType === 'image/png';
  }

  return /\.(jpe?g|png)$/i.test(file?.originalName || '');
}

export default function ImagePreviewModal({ visible, file, uri, onClose }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const zoomRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const gestureRef = useRef(createGestureState());
  const saveGuardRef = useRef({ inFlight: false, saved: false });
  const canSave = isGalleryImage(file);
  const viewportHeight = Math.max(1, height - insets.top - insets.bottom - 128);

  const clampOffset = (nextOffset, nextZoom = zoomRef.current) => {
    const maxX = Math.max(0, ((nextZoom - 1) * width) / 2);
    const maxY = Math.max(0, ((nextZoom - 1) * viewportHeight) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, nextOffset.x)),
      y: Math.max(-maxY, Math.min(maxY, nextOffset.y)),
    };
  };

  const updateOffset = (nextOffset) => {
    const boundedOffset = clampOffset(nextOffset);
    offsetRef.current = boundedOffset;
    setOffset(boundedOffset);
  };

  const resetViewer = () => {
    zoomRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const resetGesture = () => {
    gestureRef.current = createGestureState();
  };

  useEffect(() => {
    if (visible) {
      resetViewer();
      resetGesture();
      saveGuardRef.current = { inFlight: false, saved: false };
      setSaved(false);
    }
  }, [visible, uri]);

  const syncTouchMap = (event, ending = false) => {
    const nativeEvent = event?.nativeEvent || {};
    const gesture = gestureRef.current;

    getTouchList(nativeEvent.touches).forEach((touch) => {
      const point = toTouchPoint(touch);
      if (point) gesture.touches.set(point.identifier, point);
    });

    getTouchList(nativeEvent.changedTouches).forEach((touch) => {
      const point = toTouchPoint(touch);
      if (!point) return;

      if (ending) {
        gesture.touches.delete(point.identifier);
      } else {
        gesture.touches.set(point.identifier, point);
      }
    });

    return gesture.touches;
  };

  const getPinchTouches = () => {
    const gesture = gestureRef.current;
    if (gesture.pinchTouchIds?.length === 2) {
      const trackedTouches = gesture.pinchTouchIds
        .map((identifier) => gesture.touches.get(identifier))
        .filter(Boolean);
      if (trackedTouches.length === 2) return trackedTouches;
    }

    return Array.from(gesture.touches.values()).slice(0, 2);
  };

  const hasActivePinchTouches = () => {
    const { pinchTouchIds, touches } = gestureRef.current;
    return pinchTouchIds?.length === 2
      && pinchTouchIds.every((identifier) => touches.has(identifier));
  };

  const beginPinch = () => {
    const pinchTouches = getPinchTouches();
    if (pinchTouches.length < 2) return false;

    const gesture = gestureRef.current;
    gesture.mode = 'pinch';
    gesture.pinchTouchIds = pinchTouches.map((touch) => touch.identifier);
    gesture.panTouchId = null;
    gesture.lastPanPoint = null;
    gesture.startDistance = getDistance(pinchTouches[0], pinchTouches[1]);
    gesture.startZoom = zoomRef.current;
    gesture.startOffset = offsetRef.current;
    gesture.startMidpoint = getMidpoint(pinchTouches[0], pinchTouches[1]);
    return true;
  };

  const beginPan = (touch) => {
    if (!touch) return;

    const gesture = gestureRef.current;
    gesture.mode = 'pan';
    gesture.pinchTouchIds = null;
    gesture.panTouchId = touch.identifier;
    gesture.lastPanPoint = touch;
  };

  const finishGesture = () => {
    resetGesture();
    if (zoomRef.current <= 1) updateOffset({ x: 0, y: 0 });
  };

  const handleTouchStart = (event) => {
    const touches = syncTouchMap(event);
    const gesture = gestureRef.current;

    if (touches.size >= 2) {
      if (gesture.mode !== 'pinch' || !hasActivePinchTouches()) beginPinch();
      return;
    }

    beginPan(Array.from(touches.values())[0]);
  };

  const handleTouchMove = (event) => {
    const touches = syncTouchMap(event);
    const gesture = gestureRef.current;

    if (touches.size >= 2) {
      if (gesture.mode !== 'pinch' || !hasActivePinchTouches()) {
        beginPinch();
        return;
      }

      const pinchTouches = getPinchTouches();
      if (pinchTouches.length < 2) return;

      const distance = getDistance(pinchTouches[0], pinchTouches[1]);
      const midpoint = getMidpoint(pinchTouches[0], pinchTouches[1]);
      const nextZoom = gesture.startDistance > 0
        ? gesture.startZoom * (distance / gesture.startDistance)
        : gesture.startZoom;

      zoomRef.current = Math.max(1, Math.min(MAX_ZOOM, nextZoom));
      setZoom(zoomRef.current);
      updateOffset({
        x: gesture.startOffset.x + midpoint.x - gesture.startMidpoint.x,
        y: gesture.startOffset.y + midpoint.y - gesture.startMidpoint.y,
      });
      return;
    }

    const touch = Array.from(touches.values())[0];
    if (!touch) return;

    if (gesture.mode !== 'pan' || gesture.panTouchId !== touch.identifier) {
      beginPan(touch);
      return;
    }

    if (zoomRef.current > 1 && gesture.lastPanPoint) {
      updateOffset({
        x: offsetRef.current.x + touch.pageX - gesture.lastPanPoint.pageX,
        y: offsetRef.current.y + touch.pageY - gesture.lastPanPoint.pageY,
      });
    }
    gesture.lastPanPoint = touch;
  };

  const handleTouchEnd = (event) => {
    const touches = syncTouchMap(event, true);
    const gesture = gestureRef.current;

    if (touches.size >= 2) {
      if (gesture.mode !== 'pinch' || !hasActivePinchTouches()) beginPinch();
      return;
    }

    if (touches.size === 1) {
      beginPan(Array.from(touches.values())[0]);
      return;
    }

    finishGesture();
  };

  const handleTouchCancel = () => {
    finishGesture();
  };

  const saveImage = async () => {
    if (saveGuardRef.current.inFlight || saveGuardRef.current.saved) return;

    if (!canSave) {
      Alert.alert('Format non pris en charge', 'Seuls les fichiers JPEG et PNG peuvent être enregistrés dans la galerie.');
      return;
    }

    saveGuardRef.current.inFlight = true;
    setIsSaving(true);
    try {
      const existingPermission = await MediaLibrary.getPermissionsAsync(true);
      const permission = existingPermission.granted
        ? existingPermission
        : await MediaLibrary.requestPermissionsAsync(true);

      if (!permission.granted) {
        Alert.alert('Permission refusée', 'Autorisez l’accès à la galerie pour enregistrer cette image.');
        return;
      }

      await filesService.saveToGallery({
        localUri: uri,
        downloadUrl: file?.downloadUrl,
        originalName: file?.originalName,
        mimeType: file?.mimeType,
      });
      saveGuardRef.current.saved = true;
      setSaved(true);
      Alert.alert('Succès', 'Image enregistrée dans la galerie.');
    } catch (error) {
      const status = error?.response?.status;
      const message = status === 401 || status === 403
        ? 'Votre session ne permet plus de télécharger cette image.'
        : error?.message || 'Impossible d’enregistrer cette image.';
      Alert.alert('Erreur', message);
    } finally {
      saveGuardRef.current.inFlight = false;
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.viewer}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} accessibilityRole="button">
            <Ionicons name="close" size={24} color="#fff" />
            <Text style={styles.closeText}>Fermer</Text>
          </TouchableOpacity>
          <Text style={styles.title} numberOfLines={1}>
            {getReadableFileName(file?.originalName) || 'Image'}
          </Text>
        </View>

        <View
          style={styles.imageViewport}
          onStartShouldSetResponderCapture={() => true}
          onMoveShouldSetResponderCapture={() => true}
          onResponderTerminationRequest={() => false}
          onResponderTerminate={handleTouchCancel}
          onResponderRelease={finishGesture}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
        >
          {uri ? (
            <Animated.Image
              source={{ uri }}
              pointerEvents="none"
              resizeMode="contain"
              style={[
                styles.image,
                { transform: [{ translateX: offset.x }, { translateY: offset.y }, { scale: zoom }] },
              ]}
            />
          ) : (
            <ActivityIndicator color="#fff" size="large" />
          )}
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
          <Text style={styles.zoomHint}>Pincez pour zoomer · Déplacez avec un doigt</Text>
          <TouchableOpacity
            style={[styles.saveButton, (!canSave || isSaving || saved) && styles.disabledButton]}
            onPress={saveImage}
            disabled={isSaving || saved}
            accessibilityRole="button"
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name={saved ? 'checkmark-circle-outline' : 'download-outline'} size={20} color="#fff" />
            )}
            <Text style={styles.saveText}>
              {isSaving ? 'Enregistrement…' : saved ? 'Enregistrée' : 'Enregistrer dans la galerie'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = {
  viewer: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  closeText: {
    color: '#fff',
    fontWeight: '700',
  },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  imageViewport: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  zoomHint: {
    color: '#ddd',
    textAlign: 'center',
    fontSize: 12,
  },
  saveButton: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  disabledButton: {
    opacity: 0.55,
  },
  saveText: {
    color: '#fff',
    fontWeight: '700',
  },
};
