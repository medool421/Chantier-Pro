import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axios';
import { filesService } from '../api/files.service';
import ImagePreviewModal from './ImagePreviewModal';
import { colors } from '../theme/colors';

export default function ReportImagePreview({ report, style, imageStyle, compact = false }) {
  const uri = report?.imageUrl;
  const id = report?.id || report?._id;

  const [imageFailed, setImageFailed] = useState(false);
  const [displayUri, setDisplayUri] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);

  const isLocalPhoto = typeof uri === 'string' && uri.startsWith('/uploads/');
  const mimeType = typeof uri === 'string' && /\.png$/i.test(uri) ? 'image/png' : 'image/jpeg';
  const downloadUrl = isLocalPhoto && id
    ? api.getUri({ url: `/reports/${id}/photo` })
    : undefined;

  useEffect(() => {
    let active = true;
    setImageFailed(false);
    setDisplayUri('');

    if (!uri) return;

    if (!isLocalPhoto) {
      let resolvedUri = uri;
      const baseUrl = api.defaults?.baseURL || '';
      if (baseUrl.startsWith('https://') && resolvedUri.startsWith('http://')) {
        resolvedUri = 'https://' + resolvedUri.slice(7);
      }
      setDisplayUri(resolvedUri);
      return () => { active = false; };
    }

    filesService.downloadToCache({
      downloadUrl,
      originalName: `report-${id}${mimeType === 'image/png' ? '.png' : '.jpg'}`,
      mimeType,
    })
      .then((localUri) => {
        if (active) setDisplayUri(localUri);
      })
      .catch(() => {
        if (active) setImageFailed(true);
      });

    return () => { active = false; };
  }, [downloadUrl, id, isLocalPhoto, mimeType, uri]);

  if (!uri) return null;

  if (imageFailed || (!isLocalPhoto && !/^https?:\/\//i.test(uri))) {
    return (
      <View style={[styles.fallbackContainer, compact && styles.fallbackCompact, style]}>
        <Ionicons name="image-outline" size={compact ? 18 : 24} color={colors.textMuted} />
        <Text style={styles.fallbackText}>Photo indisponible</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {displayUri ? (
        <TouchableOpacity
          onPress={() => setPreviewVisible(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Agrandir la photo du rapport"
        >
          <Image
            source={{ uri: displayUri }}
            style={[compact ? styles.compactImage : styles.defaultImage, imageStyle]}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        </TouchableOpacity>
      ) : (
        <View style={[compact ? styles.compactImage : styles.defaultImage, styles.loadingContainer, imageStyle]}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      <ImagePreviewModal
        visible={previewVisible}
        file={{
          originalName: `Rapport - ${report?.title || 'Photo'}`,
          mimeType: isLocalPhoto ? mimeType : 'image/jpeg',
          downloadUrl,
        }}
        uri={displayUri}
        onClose={() => setPreviewVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  defaultImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#F0F2F5',
  },
  compactImage: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    backgroundColor: '#F0F2F5',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  fallbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    marginVertical: 8,
  },
  fallbackCompact: {
    padding: 8,
  },
  fallbackText: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
