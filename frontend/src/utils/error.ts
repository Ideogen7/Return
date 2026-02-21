import type { AxiosError } from 'axios';
import type { TFunction } from 'i18next';
import type { ProblemDetails } from '../types/api.types';

// Extrait un ProblemDetails depuis une erreur Axios
export function parseProblemDetails(error: AxiosError): ProblemDetails | null {
  const data = error.response?.data;
  if (data && typeof data === 'object' && 'type' in data) {
    return data as ProblemDetails;
  }
  return null;
}

// Table de correspondance type d'erreur → clé i18n
const ERROR_TYPE_MAP: Record<string, string> = {
  'https://api.return.app/errors/invalid-credentials': 'errors.invalidCredentials',
  'https://api.return.app/errors/email-already-exists': 'errors.emailAlreadyExists',
  'https://api.return.app/errors/active-loans-exist': 'errors.activeLoansExist',
  'https://api.return.app/errors/invalid-current-password': 'errors.invalidCurrentPassword',
  'https://api.return.app/errors/validation-failed': 'errors.validationFailed',
  'https://api.return.app/errors/network-error': 'errors.networkError',
};

// Traduit un ProblemDetails en message lisible
export function getErrorMessage(error: ProblemDetails, t: TFunction): string {
  const i18nKey = ERROR_TYPE_MAP[error.type];
  if (i18nKey) {
    return t(i18nKey);
  }
  return error.detail || t('errors.unknownError');
}
