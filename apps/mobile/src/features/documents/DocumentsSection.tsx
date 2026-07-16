// Documents section of the traveler detail. Each document is a card button that
// mirrors the health button UI; tapping an image previews it inline (full-screen
// modal); other files (PDFs) open in the system viewer. Binaries download on first
// open when online and not yet cached.
//
// Trip admins also get an "Adicionar documento" button: it adds a Termo de Compromisso
// (everyone) or Autorização de Viagem Nacional (travelers under 16) fully offline — the
// photo is stored locally and the sync engine pushes it when back online.
import Ionicons from '@expo/vector-icons/Ionicons';
import { requiresNationalTravelAuthorization } from '@viagem/core';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SectionTitle } from '@/components/GroupedCard';
import { isCurrentUserTripAdmin, listDocuments } from '@/db/daos';
import type { DocumentRow, TravelerRow } from '@/db/types';
import { useSession } from '@/features/auth/SessionProvider';
import { useMirrorQuery, useSync } from '@/features/sync/SyncProvider';
import { UPLOAD_IMAGE_QUALITY } from '@/lib/config';
import { DOCUMENT_KIND_LABELS, DOCUMENT_SECTION_LABELS } from '@/lib/format';
import { useTheme } from '@/theme';

import { getLocalDocumentUri, isImageDocument } from './cache';
import { addTravelerDocument, type PickedAsset, type UploadableKind } from './upload';

type Preview = { uri: string; title: string };

// Display order of the documents (mirrors the form's step order, then admin-added docs).
const KIND_ORDER: DocumentRow['kind'][] = [
  'identity_document',
  'photo',
  'authorization',
  'commitment_term',
  'national_travel_authorization',
  'other',
];

function sortByKind(documents: readonly DocumentRow[]) {
  return [...documents].sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind));
}

export function DocumentsSection({ traveler }: { traveler: TravelerRow }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const { syncNow } = useSync();
  const userId = session?.user.id ?? null;
  const [cacheVersion, setCacheVersion] = useState(0);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);

  const documents = useMirrorQuery(
    () => listDocuments(traveler.id),
    [traveler.id, cacheVersion],
  );
  const isAdmin = useMirrorQuery(
    () => (userId ? isCurrentUserTripAdmin(traveler.trip_id, userId) : Promise.resolve(false)),
    [traveler.trip_id, userId],
  );

  // Which kinds the admin can add for this traveler (national auth only for under-16).
  const addableKinds = useMemo<UploadableKind[]>(() => {
    const kinds: UploadableKind[] = ['commitment_term'];
    if (requiresNationalTravelAuthorization(traveler.birth_date, new Date())) {
      kinds.push('national_travel_authorization');
    }
    return kinds;
  }, [traveler.birth_date]);

  const openDocument = useCallback(async (doc: DocumentRow) => {
    setOpeningId(doc.id);
    try {
      const uri = await getLocalDocumentUri(doc);
      setCacheVersion((version) => version + 1);
      if (isImageDocument(doc)) {
        // Preview images inline instead of handing them off to the system viewer.
        setPreview({ uri, title: DOCUMENT_KIND_LABELS[doc.kind] ?? doc.kind });
      } else {
        await Sharing.shareAsync(uri, { mimeType: doc.mime_type ?? undefined });
      }
    } catch {
      Alert.alert(
        'Documento indisponível',
        'Este documento ainda não foi baixado. Conecte-se à internet e tente novamente.',
      );
    } finally {
      setOpeningId(null);
    }
  }, []);

  const pickAndAdd = useCallback(
    async (kind: UploadableKind, source: 'camera' | 'library') => {
      if (!userId) return;
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permissão necessária',
          'Autorize o acesso à câmera ou às fotos nas configurações para anexar documentos.',
        );
        return;
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ quality: UPLOAD_IMAGE_QUALITY })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: UPLOAD_IMAGE_QUALITY,
            });
      if (result.canceled || result.assets.length === 0) return;

      const picked = result.assets[0];
      const asset: PickedAsset = {
        uri: picked.uri,
        fileName: picked.fileName,
        mimeType: picked.mimeType,
        fileSize: picked.fileSize,
      };

      setAdding(true);
      try {
        await addTravelerDocument({ traveler, kind, asset, userId });
        setCacheVersion((version) => version + 1);
        // Best-effort immediate push; if offline, it stays pending for the next sync.
        void syncNow();
      } catch {
        Alert.alert(
          'Não foi possível adicionar',
          'Verifique se o arquivo é uma imagem válida e tente novamente.',
        );
      } finally {
        setAdding(false);
      }
    },
    [traveler, userId, syncNow],
  );

  const promptSource = useCallback(
    (kind: UploadableKind) => {
      Alert.alert(DOCUMENT_KIND_LABELS[kind], undefined, [
        { text: 'Tirar foto', onPress: () => void pickAndAdd(kind, 'camera') },
        { text: 'Escolher da galeria', onPress: () => void pickAndAdd(kind, 'library') },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    },
    [pickAndAdd],
  );

  const promptAdd = useCallback(() => {
    if (addableKinds.length === 1) {
      promptSource(addableKinds[0]);
      return;
    }
    Alert.alert('Adicionar documento', 'Escolha o tipo', [
      ...addableKinds.map((kind) => ({
        text: DOCUMENT_KIND_LABELS[kind],
        onPress: () => promptSource(kind),
      })),
      { text: 'Cancelar', style: 'cancel' as const },
    ]);
  }, [addableKinds, promptSource]);

  const hasDocuments = documents != null && documents.length > 0;
  // Render nothing until we know there's something to show (documents or the admin button).
  if (!hasDocuments && !isAdmin) {
    return null;
  }

  return (
    <>
      <SectionTitle>Documentos</SectionTitle>
      <View style={styles.list}>
        {sortByKind(documents ?? []).map((doc) => (
          <Pressable
            key={doc.id}
            accessibilityRole="button"
            accessibilityLabel={`Ver ${DOCUMENT_SECTION_LABELS[doc.kind] ?? doc.kind}`}
            onPress={() => void openDocument(doc)}
          >
            {({ pressed }) => (
              <View
                style={[
                  styles.card,
                  { backgroundColor: theme.colors.card, opacity: pressed ? 0.5 : 1 },
                ]}
              >
                <View style={[styles.icon, { backgroundColor: theme.colors.input }]}>
                  <Ionicons
                    name={isImageDocument(doc) ? 'image' : 'document-text'}
                    size={18}
                    color={theme.colors.text}
                  />
                </View>
                <View style={styles.text}>
                  <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
                    {DOCUMENT_SECTION_LABELS[doc.kind] ?? doc.kind}
                  </Text>
                  <Text
                    style={[styles.subtitle, { color: theme.colors.secondaryText }]}
                    numberOfLines={1}
                  >
                    {doc.pending_upload
                      ? 'Envio pendente'
                      : (doc.file_name ?? DOCUMENT_KIND_LABELS[doc.kind] ?? doc.kind)}
                  </Text>
                </View>
                {openingId === doc.id ? (
                  <ActivityIndicator color={theme.colors.secondaryText} />
                ) : doc.pending_upload ? (
                  <Ionicons name="cloud-upload-outline" size={17} color={theme.colors.tertiaryText} />
                ) : (
                  <Ionicons name="chevron-forward" size={17} color={theme.colors.tertiaryText} />
                )}
              </View>
            )}
          </Pressable>
        ))}

        {isAdmin ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Adicionar documento"
            disabled={adding}
            onPress={promptAdd}
          >
            {({ pressed }) => (
              <View
                style={[
                  styles.card,
                  { backgroundColor: theme.colors.card, opacity: pressed || adding ? 0.5 : 1 },
                ]}
              >
                <View style={[styles.icon, { backgroundColor: theme.colors.input }]}>
                  <Ionicons name="add" size={20} color={theme.colors.text} />
                </View>
                <View style={styles.text}>
                  <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
                    Adicionar documento
                  </Text>
                </View>
                {adding ? <ActivityIndicator color={theme.colors.secondaryText} /> : null}
              </View>
            )}
          </Pressable>
        ) : null}
      </View>

      <Modal
        visible={preview !== null}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setPreview(null)}
        statusBarTranslucent
      >
        <View style={styles.previewBackdrop}>
          <ScrollView
            style={styles.previewScroll}
            contentContainerStyle={styles.previewContent}
            maximumZoomScale={4}
            minimumZoomScale={1}
            centerContent
          >
            {preview ? (
              <Image
                source={{ uri: preview.uri }}
                style={styles.previewImage}
                resizeMode="contain"
                accessibilityLabel={preview.title}
              />
            ) : null}
          </ScrollView>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fechar pré-visualização"
            hitSlop={12}
            onPress={() => setPreview(null)}
            style={[styles.previewClose, { top: insets.top + 8 }]}
          >
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontSize: 17,
  },
  subtitle: {
    fontSize: 13,
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: '#000000',
  },
  previewScroll: {
    flex: 1,
  },
  previewContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewClose: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});
