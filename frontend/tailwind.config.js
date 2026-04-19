/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"',
          '"Helvetica Neue"', 'Arial', 'sans-serif',
        ],
        mono: ['"SF Mono"', '"JetBrains Mono"', 'Menlo', 'Monaco', 'Courier', 'monospace'],
      },
      colors: {
        ss: {
          bg:     '#f5f5f7',
          card:   '#ffffff',
          blue:   '#0071e3',
          indigo: '#5856d6',
          green:  '#34c759',
          red:    '#ff3b30',
          amber:  '#ff9500',
          teal:   '#32ade6',
          purple: '#af52de',
          t1:     '#1d1d1f',
          t2:     '#6e6e73',
          t3:     '#aeaeb2',
        },
      },
    },
  },
  plugins: [],
}
