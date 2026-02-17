module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'setup',
        'loans',
        'reminders',
        'auth',
        'photos',
        'notifications',
        'users',
        'db',
        'api',
        'i18n',
        'ui',
        'navigation',
        'ci',
      ],
    ],
  },
};
