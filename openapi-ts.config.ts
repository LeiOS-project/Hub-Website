import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
    input: 'http://localhost:3003/docs/openapi',
    output: 'app/api-client',
    plugins: [
        '@hey-api/client-nuxt'
    ]
});