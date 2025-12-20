/** @type {import('tailwindcss').Config} */
export default {
    theme: { extend: {} },
    // daisyUI se charge via @plugin dans assets/tailwind.css (v4)
    daisyui: {
        themes: [
            {
                'synthwave-hi': {
                    'color-scheme': 'dark',
                    'primary':   '#FF71E6',
                    'secondary': '#00E5FF',
                    'accent':    '#FFD166',
                    'neutral':   '#1f2937',
                    'base-100':  '#140a2a',
                    'base-200':  '#1b1038',
                    'base-content': '#F7F7FF',
                    'info':    '#38bdf8',
                    'success': '#22c55e',
                    'warning': '#f59e0b',
                    'error':   '#ef4444'
                    // ajoute d’autres tokens si besoin
                }
            },
            'synthwave','cyberpunk','halloween','dracula'
        ]
    }
}
