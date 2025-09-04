import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '1rem',
			screens: {
				'sm': '640px',
				'md': '768px',
				'lg': '1024px',
				'xl': '1280px',
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					light: 'hsl(var(--primary-light))',
					dark: 'hsl(var(--primary-dark))',
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))',
					light: 'hsl(var(--success-light))',
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))',
					light: 'hsl(var(--warning-light))',
				},
				info: {
					DEFAULT: 'hsl(var(--info))',
					foreground: 'hsl(var(--info-foreground))',
					light: 'hsl(var(--info-light))',
				},
				'touch-feedback': 'var(--touch-feedback)',
				'touch-pressed': 'var(--touch-pressed)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'2xl': '16px',
				'xl': '12px',
			},
			boxShadow: {
				'xs': 'var(--shadow-xs)',
				'sm': 'var(--shadow-sm)',
				'md': 'var(--shadow-md)',
				'lg': 'var(--shadow-lg)',
				'xl': 'var(--shadow-xl)',
				'2xl': 'var(--shadow-2xl)',
				'mobile': 'var(--shadow-mobile)',
			},
			spacing: {
				'touch': 'var(--touch-target)',
				'mobile': 'var(--mobile-padding)',
				'18': '4.5rem',
				'88': '22rem',
			},
			height: {
				'touch': 'var(--touch-target)',
			},
			width: {
				'touch': 'var(--touch-target)',
			},
			minHeight: {
				'touch': 'var(--touch-target)',
			},
			minWidth: {
				'touch': 'var(--touch-target)',
			},
			transitionTimingFunction: {
				'mobile': 'var(--motion-mobile)',
				'bounce': 'var(--motion-bounce)',
			},
			transitionDuration: {
				'mobile': '200ms',
				'touch': '150ms',
				'bounce': '400ms',
			},
			keyframes: {
				// Accordion animations
				'accordion-down': {
					from: { height: '0', opacity: '0' },
					to: { height: 'var(--radix-accordion-content-height)', opacity: '1' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)', opacity: '1' },
					to: { height: '0', opacity: '0' }
				},
				// Mobile-optimized animations
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'slide-up': {
					'0%': { opacity: '0', transform: 'translateY(30px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					'0%': { opacity: '0', transform: 'scale(0.9)' },
					'100%': { opacity: '1', transform: 'scale(1)' }
				},
				'bounce-in': {
					'0%': { opacity: '0', transform: 'scale(0.3)' },
					'50%': { opacity: '1', transform: 'scale(1.05)' },
					'70%': { transform: 'scale(0.9)' },
					'100%': { transform: 'scale(1)' }
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)' },
					'100%': { transform: 'translateX(0)' }
				},
				'slide-out-right': {
					'0%': { transform: 'translateX(0)' },
					'100%': { transform: 'translateX(100%)' }
				},
				'pulse-ring': {
					'0%': { transform: 'scale(0.33)', opacity: '1' },
					'80%, 100%': { transform: 'scale(2.4)', opacity: '0' }
				},
			},
			animation: {
				// Core animations
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				
				// Mobile UI animations
				'fade-in': 'fade-in 0.4s var(--motion-mobile)',
				'slide-up': 'slide-up 0.4s var(--motion-mobile)',
				'scale-in': 'scale-in 0.3s var(--motion-mobile)',
				'bounce-in': 'bounce-in 0.6s var(--motion-bounce)',
				'slide-in-right': 'slide-in-right 0.3s var(--motion-mobile)',
				'slide-out-right': 'slide-out-right 0.3s var(--motion-mobile)',
				'pulse-ring': 'pulse-ring 1.25s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite',
				
				// Utility animations
				'spin-slow': 'spin 3s linear infinite',
			},
			backdropBlur: {
				'xs': '2px',
			},
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		// Mobile-first responsive utilities
		function({ addUtilities }: any) {
			const newUtilities = {
				'.safe-area-inset-top': {
					paddingTop: 'env(safe-area-inset-top)',
				},
				'.safe-area-inset-bottom': {
					paddingBottom: 'env(safe-area-inset-bottom)',
				},
				'.safe-area-inset-left': {
					paddingLeft: 'env(safe-area-inset-left)',
				},
				'.safe-area-inset-right': {
					paddingRight: 'env(safe-area-inset-right)',
				},
			}
			addUtilities(newUtilities)
		}
	],
} satisfies Config;
