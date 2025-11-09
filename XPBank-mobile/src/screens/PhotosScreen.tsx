import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { usePhotos } from '../features/photos/hooks/usePhotos';
import { useDeletePhoto } from '../features/photos/hooks/useDeletePhoto';
import { useUpload } from '../features/photos/hooks/useUpload';
import { Photo, SortBy, SortOrder } from '../features/photos/types/photo';
import { getPhotoUrl } from '../features/photos/api/getPhotoUrl';
import * as ImagePicker from 'expo-image-picker';
import { useStorageQuota } from '../features/photos/hooks/useStorageQuota';
import { formatStorageQuota } from '../features/photos/utils/formatFileSize';

export const PhotosScreen = () => {
  const [sortBy, setSortBy] = useState<SortBy>('uploadedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(new Map());
  
  const { data: photosData, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } = usePhotos(sortBy, sortOrder);
  const allPhotos = photosData?.pages.flatMap((page) => page.photos) || [];
  const deletePhotoMutation = useDeletePhoto();
  const { uploadImages, isUploading } = useUpload();
  const { data: storageStats } = useStorageQuota();

  // Load photo URLs
  useEffect(() => {
    if (!photosData) return;

    const loadUrls = async () => {
      const photos = photosData.pages.flatMap((page) => page.photos);
      const newUrls = new Map<string, string>();

      // Load URLs for all photos
      const urlPromises = photos.map(async (photo) => {
        try {
          const url = await getPhotoUrl({ photoId: photo.photoId });
          return { photoId: photo.photoId, url };
        } catch (error) {
          console.error(`Failed to load URL for photo ${photo.photoId}:`, error);
          return null;
        }
      });

      const results = await Promise.all(urlPromises);
      results.forEach((result) => {
        if (result) {
          newUrls.set(result.photoId, result.url);
        }
      });

      setPhotoUrls((prev) => {
        const updated = new Map(prev);
        newUrls.forEach((url, photoId) => {
          updated.set(photoId, url);
        });
        return updated;
      });
    };

    loadUrls();
  }, [photosData]);

  const handlePickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        const images = result.assets.map((asset) => ({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          fileSize: asset.fileSize,
          mimeType: asset.mimeType || 'image/jpeg',
          filename: asset.fileName || `photo_${Date.now()}.jpg`,
        }));

        try {
          await uploadImages(images);
        } catch (error: any) {
          Alert.alert('Upload Error', error.message || 'Failed to upload images');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick images');
    }
  };

  const handleDeletePhoto = (photo: Photo) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePhotoMutation.mutateAsync({ photoId: photo.photoId });
            } catch (error) {
              Alert.alert('Error', 'Failed to delete photo');
            }
          },
        },
      ]
    );
  };

  const renderPhoto = ({ item }: { item: Photo }) => {
    const photoUrl = photoUrls.get(item.photoId) || '';
    return (
      <TouchableOpacity
        style={styles.photoContainer}
        onPress={() => setSelectedPhoto(item)}
        onLongPress={() => handleDeletePhoto(item)}
      >
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <ActivityIndicator size="small" color="#6B7280" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.title}>Photos</Text>
        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handlePickImages}
          disabled={isUploading}
        >
          <Text style={styles.uploadButtonText}>
            {isUploading ? 'Uploading...' : 'Upload'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {storageStats && (
        <View style={styles.storageInfo}>
          <Text style={styles.storageText}>
            {formatStorageQuota(storageStats.storageUsed, storageStats.storageQuota)}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${storageStats.percentageUsed}%` },
              ]}
            />
          </View>
        </View>
      )}

      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === 'uploadedAt' && styles.sortButtonActive,
          ]}
          onPress={() => setSortBy('uploadedAt')}
        >
          <Text
            style={[
              styles.sortButtonText,
              sortBy === 'uploadedAt' && styles.sortButtonTextActive,
            ]}
          >
            Date
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === 'filename' && styles.sortButtonActive,
          ]}
          onPress={() => setSortBy('filename')}
        >
          <Text
            style={[
              styles.sortButtonText,
              sortBy === 'filename' && styles.sortButtonTextActive,
            ]}
          >
            Name
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sortOrderButton}
          onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          <Text style={styles.sortOrderText}>
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#2563EB" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={allPhotos}
        renderItem={renderPhoto}
        keyExtractor={(item) => item.photoId}
        numColumns={3}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#2563EB"
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listContent: {
    padding: 4,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  uploadButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  storageInfo: {
    marginBottom: 16,
  },
  storageText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
  },
  sortContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  sortButtonActive: {
    backgroundColor: '#2563EB',
  },
  sortButtonText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  sortOrderButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
  },
  sortOrderText: {
    color: '#6B7280',
    fontWeight: '600',
    fontSize: 16,
  },
  photoContainer: {
    flex: 1,
    aspectRatio: 1,
    margin: 2,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  photoPlaceholder: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
});

