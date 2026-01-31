const i18n = {
    translations: {},
    currentLang: localStorage.getItem('selectedLang') || 'es',

    async load(lang) {
        this.currentLang = lang;
        localStorage.setItem('selectedLang', lang);
        try {
            const response = await fetch(`./locales/${lang}.json`);
            this.translations = await response.json();
            this.translatePage();
            document.dispatchEvent(new CustomEvent('languageChanged'));
            document.documentElement.lang = lang;
        } catch (error) {
            console.error("Error cargando idioma:", error);
        }
    },

    translatePage() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        // Esto navega por el JSON (ej: privacidad.titulo)
        const translation = key.split('.').reduce((obj, i) => (obj ? obj[i] : null), this.translations);
        
        if (translation) {
            // 1. Manejo de inputs y textareas (Placeholders)
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translation;
                return; 
            }

            // 2. Manejo de etiquetas con HTML (como los <strong> de tu política)
            // Usamos innerHTML para que el navegador renderice las negritas
            el.innerHTML = translation;
        }
    });
},

};

window.i18n = i18n;
document.addEventListener('DOMContentLoaded', () => i18n.load(i18n.currentLang));