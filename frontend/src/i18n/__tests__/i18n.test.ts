import i18n from '../../config/i18n.config';

describe('i18n', () => {
  it('should have FR and EN resources loaded', () => {
    expect(i18n.hasResourceBundle('fr', 'translation')).toBe(true);
    expect(i18n.hasResourceBundle('en', 'translation')).toBe(true);
  });

  it('should translate to French', async () => {
    await i18n.changeLanguage('fr');
    expect(i18n.t('auth.login')).toBe('Connexion');
    expect(i18n.t('common.cancel')).toBe('Annuler');
  });

  it('should translate to English', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('auth.login')).toBe('Login');
    expect(i18n.t('common.cancel')).toBe('Cancel');
  });

  it('should switch language dynamically', async () => {
    await i18n.changeLanguage('fr');
    expect(i18n.t('navigation.loans')).toBe('Prêts');

    await i18n.changeLanguage('en');
    expect(i18n.t('navigation.loans')).toBe('Loans');
  });
});
