/** @type {import('next').NextConfig} */
const imageHostnames = String(process.env.NEXT_PUBLIC_IMAGE_HOSTS || '')
	.split(',')
	.map((value) => value.trim())
	.filter(Boolean);

const nextConfig = {
	// Avoid dev/build collisions when both commands run in parallel terminals.
	distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
	reactStrictMode: true,
	poweredByHeader: false,
	compress: true,
	images: {
		formats: ['image/avif', 'image/webp'],
		remotePatterns: imageHostnames.map((hostname) => ({
			protocol: 'https',
			hostname,
		})),
	},
};

export default nextConfig;
