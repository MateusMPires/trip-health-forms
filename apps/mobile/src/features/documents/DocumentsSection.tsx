// Documents section of the traveler detail. Each document is a card button that
// mirrors the health button UI; tapping an image previews it inline (full-screen
// modal); other files (PDFs) open in the system viewer. Binaries download on first
// open when online and not yet cached.
//
// After the regular documents, trip admins get one dedicated slot per admin-managed
// kind — Termo de Compromisso (everyone) and Autorização de Viagem Nacional (travelers
// under 16). An empty slot is an "add" button; a filled slot shows the document (tap to
// view) plus replace/delete actions. Collaborators and group leaders (non-admins) only
// see filled slots, view-only. Add/replace/delete are offline-first (see ./upload).
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
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
import { regularDocuments, selectDocumentSlots, type DocumentSlot } from './slots';
import {
  addTravelerDocument,
  deleteTravelerDocument,
  replaceTravelerDocument,
  type PickedAsset,
  type UploadableKind,
} from './upload';

type Preview = { uri: string; title: string };

// Display order of the regular documents (mirrors the form's step order).
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
  // The slot kind whose add/replace/delete is in flight (one action per slot at a time).
  const [busyKind, setBusyKind] = useState<UploadableKind | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  const documents = useMirrorQuery(
    () => listDocuments(traveler.id),
    [traveler.id, cacheVersion],
  );
  const isAdmin = useMirrorQuery(
    () => (userId ? isCurrentUserTripAdmin(traveler.trip_id, userId) : Promise.resolve(false)),
    [traveler.trip_id, userId],
  );

  // Regular documents (identity / health card / etc.) shown as-is, then the two
  // admin-managed slots (national auth only for under-16 travelers).
  const regulars = useMemo(() => sortByKind(regularDocuments(documents ?? [])), [documents]);
  const slots = useMemo(
    () => selectDocumentSlots(documents ?? [], traveler.birth_date, new Date()),
    [documents, traveler.birth_date],
  );

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

  // Requests permission and picks an image (camera or gallery). Returns null on
  // cancel / denied permission (already surfaced to the user).
  const pickImage = useCallback(
    async (source: 'camera' | 'library'): Promise<PickedAsset | null> => {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permissão necessária',
          'Autorize o acesso à câmera ou às fotos nas configurações para anexar documentos.',
        );
        return null;
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ quality: UPLOAD_IMAGE_QUALITY })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: UPLOAD_IMAGE_QUALITY,
            });
      if (result.canceled || result.assets.length === 0) return null;

      const picked = result.assets[0];
      return {
        uri: picked.uri,
        fileName: picked.fileName,
        mimeType: picked.mimeType,
        fileSize: picked.fileSize,
      };
    },
    [],
  );

  // Runs a slot mutation (add / replace / delete) with a busy state + best-effort push.
  const runSlotAction = useCallback(
    async (kind: UploadableKind, action: () => Promise<unknown>, errorMessage: string) => {
      setBusyKind(kind);
      try {
        await action();
        setCacheVersion((version) => version + 1);
        // Best-effort immediate push; if offline, it stays pending for the next sync.
        void syncNow();
      } catch {
        Alert.alert('Não foi possível concluir', errorMessage);
      } finally {
        setBusyKind(null);
      }
    },
    [syncNow],
  );

  const addDocument = useCallback(
    async (kind: UploadableKind, source: 'camera' | 'library') => {
      if (!userId) return;
      const asset = await pickImage(source);
      if (!asset) return;
      await runSlotAction(
        kind,
        () => addTravelerDocument({ traveler, kind, asset, userId }),
        'Verifique se o arquivo é uma imagem válida e tente novamente.',
      );
    },
    [pickImage, runSlotAction, traveler, userId],
  );

  const replaceDocument = useCallback(
    async (kind: UploadableKind, oldDoc: DocumentRow, source: 'camera' | 'library') => {
      if (!userId) return;
      const asset = await pickImage(source);
      if (!asset) return;
      await runSlotAction(
        kind,
        () => replaceTravelerDocument({ traveler, kind, oldDoc, asset, userId }),
        'Verifique se o arquivo é uma imagem válida e tente novamente.',
      );
    },
    [pickImage, runSlotAction, traveler, userId],
  );

  const deleteDocument = useCallback(
    (kind: UploadableKind, doc: DocumentRow) => {
      void runSlotAction(
        kind,
        () => deleteTravelerDocument(doc),
        'Não foi possível excluir o documento. Tente novamente.',
      );
    },
    [runSlotAction],
  );

  const promptSource = useCallback(
    (kind: UploadableKind) => {
      Alert.alert(DOCUMENT_KIND_LABELS[kind], undefined, [
        { text: 'Tirar foto', onPress: () => void addDocument(kind, 'camera') },
        { text: 'Escolher da galeria', onPress: () => void addDocument(kind, 'library') },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    },
    [addDocument],
  );

  const promptReplaceSource = useCallback(
    (kind: UploadableKind, doc: DocumentRow) => {
      Alert.alert(DOCUMENT_KIND_LABELS[kind], undefined, [
        { text: 'Tirar foto', onPress: () => void replaceDocument(kind, doc, 'camera') },
        { text: 'Escolher da galeria', onPress: () => void replaceDocument(kind, doc, 'library') },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    },
    [replaceDocument],
  );

  const confirmDelete = useCallback(
    (kind: UploadableKind, doc: DocumentRow) => {
      Alert.alert('Excluir documento?', `${DOCUMENT_KIND_LABELS[kind]} será removido deste viajante.`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => deleteDocument(kind, doc) },
      ]);
    },
    [deleteDocument],
  );

  // A document card (tap to view). `trailing` is the right-hand affordance (chevron,
  // pending indicator, spinner, or the admin replace/delete actions).
  const documentRow = (doc: DocumentRow, label: string, trailing: ReactNode) => (
    <Pressable
      key={doc.id}
      accessibilityRole="button"
      accessibilityLabel={`Ver ${label}`}
      onPress={() => void openDocument(doc)}
    >
      {({ pressed }) => (
        <View
          style={[styles.card, { backgroundColor: theme.colors.card, opacity: pressed ? 0.5 : 1 }]}
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
              {label}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.secondaryText }]} numberOfLines={1}>
              {doc.pending_upload
                ? 'Envio pendente'
                : (doc.file_name ?? DOCUMENT_KIND_LABELS[doc.kind] ?? doc.kind)}
            </Text>
          </View>
          {trailing}
        </View>
      )}
    </Pressable>
  );

  // Right-hand affordance for a view-only row (regular docs, and slots for non-admins).
  const viewTrailing = (doc: DocumentRow): ReactNode =>
    openingId === doc.id ? (
      <ActivityIndicator color={theme.colors.secondaryText} />
    ) : doc.pending_upload ? (
      <Ionicons name="cloud-upload-outline" size={17} color={theme.colors.tertiaryText} />
    ) : (
      <Ionicons name="chevron-forward" size={17} color={theme.colors.tertiaryText} />
    );

  // Replace + delete actions for a filled slot (admin only). Nested Pressables so tapping
  // an action doesn't also open the document. Colors stay grayscale per the theme.
  const adminActions = (kind: UploadableKind, doc: DocumentRow): ReactNode => {
    if (busyKind === kind || openingId === doc.id) {
      return <ActivityIndicator color={theme.colors.secondaryText} />;
    }
    const label = DOCUMENT_SECTION_LABELS[kind];
    return (
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Substituir ${label}`}
          hitSlop={10}
          onPress={() => promptReplaceSource(kind, doc)}
          style={styles.actionButton}
        >
          <Ionicons name="swap-horizontal-outline" size={20} color={theme.colors.secondaryText} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Excluir ${label}`}
          hitSlop={10}
          onPress={() => confirmDelete(kind, doc)}
          style={styles.actionButton}
        >
          <Ionicons name="trash-outline" size={20} color={theme.colors.secondaryText} />
        </Pressable>
      </View>
    );
  };

  const renderSlot = (slot: DocumentSlot): ReactNode => {
    const label = DOCUMENT_SECTION_LABELS[slot.kind];
    if (slot.doc) {
      const trailing = isAdmin ? adminActions(slot.kind, slot.doc) : viewTrailing(slot.doc);
      return documentRow(slot.doc, label, trailing);
    }
    // Empty slot: only admins get the "add" affordance.
    if (!isAdmin) return null;
    const busy = busyKind === slot.kind;
    return (
      <Pressable
        key={`add-${slot.kind}`}
        accessibilityRole="button"
        accessibilityLabel={`Adicionar ${label}`}
        disabled={busy}
        onPress={() => promptSource(slot.kind)}
      >
        {({ pressed }) => (
          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.card, opacity: pressed || busy ? 0.5 : 1 },
            ]}
          >
            <View style={[styles.icon, { backgroundColor: theme.colors.input }]}>
              <Ionicons name="add" size={20} color={theme.colors.text} />
            </View>
            <View style={styles.text}>
              <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
                {label}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.secondaryText }]} numberOfLines={1}>
                Adicionar
              </Text>
            </View>
            {busy ? <ActivityIndicator color={theme.colors.secondaryText} /> : null}
          </View>
        )}
      </Pressable>
    );
  };

  // Non-admins with nothing to show see nothing; admins always see the slots (as add rows).
  const hasContent = regulars.length > 0 || slots.some((slot) => slot.doc !== null);
  if (!hasContent && !isAdmin) {
    return null;
  }

  return (
    <>
      <SectionTitle>Documentos</SectionTitle>
      <View style={styles.list}>
        {regulars.map((doc) =>
          documentRow(doc, DOCUMENT_SECTION_LABELS[doc.kind] ?? doc.kind, viewTrailing(doc)),
        )}
        {slots.map((slot) => renderSlot(slot))}
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    padding: 6,
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
