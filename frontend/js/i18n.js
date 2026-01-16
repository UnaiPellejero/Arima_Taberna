const i18n = {
    // Idiomas soportados
    translations: {},
    currentLang: localStorage.getItem('selectedLang') || 'es',

    // Cargar archivos JSON
    async load(lang) {
        this.currentLang = lang;
        localStorage.setItem('selectedLang', lang);
        const response = await fetch(`./locales/${lang}.json`);
        this.translations = await response.json();
        this.translatePage();
        document.documentElement.lang = lang; // Cambia <html lang="...">
    },

    // Buscar elementos con el atributo data-i18n
    translatePage() {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.getNestedValue(this.translations, key);
            if (translation) {
                // Si es un input con placeholder, traducimos el placeholder
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = translation;
                } else {
                    el.innerHTML = translation;
                }
            }
        });
    },

    // Función auxiliar para leer claves anidadas como "nav.inicio"
    getNestedValue(obj, path) {
        return path.split('.').reduce((prev, curr) => prev ? prev[curr] : null, obj);
    }
};

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => i18n.load(i18n.currentLang));