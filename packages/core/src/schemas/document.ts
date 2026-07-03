import { z } from 'zod';
import { DOCUMENT_KINDS } from '../constants/enums';

// Mirrors public.documents (file metadata pointer; the binary lives in Storage). The client
// uploads first, then submits these pointers. Path convention:
//   {organization_id}/{trip_id}/{traveler_id}/{kind}/{uuid}-{filename}
export const documentInputSchema = z.object({
  kind: z.enum(DOCUMENT_KINDS).default('other'),
  storage_bucket: z.string().default('traveler-files'),
  storage_path: z.string().trim().min(1, 'storage_path is required'),
  file_name: z.string().nullish(),
  mime_type: z.string().nullish(),
  size_bytes: z.number().int().nonnegative().nullish(),
});

export type DocumentInput = z.infer<typeof documentInputSchema>;
