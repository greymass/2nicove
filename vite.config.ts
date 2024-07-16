import { paraglide } from '@inlang/paraglide-sveltekit/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
	plugins: [paraglide({ project: './project.inlang', outdir: './src/lib/paraglide' }), sveltekit()],
	resolve: {
		alias: {
			$paraglide: path.resolve(__dirname, './src/paraglide')
		}
	}
});
