// =============================================================================
// Mime-type helpers — utilitaires de conversion MIME → extension fichier
// =============================================================================

/** Map des MIME types images autorisés vers extensions sûres */
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
};

/**
 * Convertit un MIME type en extension de fichier sûre (allowlist).
 * Retourne 'jpg' par défaut si le MIME type n'est pas reconnu.
 *
 * @param mimetype - Le MIME type du fichier (ex: 'image/jpeg')
 * @returns Extension sûre sans point (ex: 'jpg', 'png')
 */
export function mimeToExtension(mimetype: string): string {
  return MIME_TO_EXT[mimetype] ?? 'jpg';
}
