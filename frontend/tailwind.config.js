/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                base: '#0a0b0f',
                surface: '#10121a',
                card: '#13161f',
                'card-hover': '#181d2a',
                border: '#1e2436',
                accent: '#25d366',
                'accent-dim': '#1a9e4c',
                'accent-glow': 'rgba(37, 211, 102, 0.18)',
                text: {
                    primary: '#f0f2f8',
                    secondary: '#8b92a9',
                    muted: '#4a5170',
                },
                brand: {
                    50: '#f0fdf4',
                    100: '#dcfce7',
                    200: '#bbf7d0',
                    300: '#86efac',
                    400: '#4ade80',
                    500: '#22c55e',
                    600: '#16a34a',
                    700: '#15803d',
                    800: '#166534',
                    900: '#14532d',
                    950: '#052e16',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
