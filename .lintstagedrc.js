module.exports = {
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix',
    'prettier --write',
    'jest --bail --findRelatedTests --passWithNoTests',
  ],
  '*.{json,md,yml,yaml}': ['prettier --write'],
  '*.{png,jpg,jpeg,gif,svg}': ['imagemin-lint-staged'],
};