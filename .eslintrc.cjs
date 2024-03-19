module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: 'airbnb-base',
    overrides: [
        {
            env: {
                node: true,
            },
            files: [
                '.eslintrc.{js,cjs}',
            ],
            parserOptions: {
                sourceType: 'script',
            },
        },
    ],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    rules: {
        camelcase: 'off',
        'comma-dangle': ['error', 'always-multiline'],
        quotes: [2, 'single', { avoidEscape: true }],
        indent: ['error', 4, { SwitchCase: 1 }],
        'import/extensions': ['error', 'ignorePackages'],
        'import/no-unresolved': 'off',
        'no-console': 'off',
        'no-continue': 'off',
        'no-plusplus': 'off',
        'no-restricted-syntax': 'off',
        'no-shadow': 'off',
        'no-underscore-dangle': 'off',
        semi: ['error', 'always'],
    },
};
