import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			// cookie first (per-user UI choice), then Accept-Language on first visit,
			// then baseLocale ("es") as the final fallback. No URL prefix.
			strategy: ['cookie', 'preferredLanguage', 'baseLocale'],
			cookieName: 'lang'
		})
	]
});
