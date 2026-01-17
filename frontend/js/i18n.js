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
            const translation = key.split('.').reduce((obj, i) => (obj ? obj[i] : null), this.translations);
            
            if (translation) {
                // Si el elemento es un botón o un enlace, buscamos su nodo de texto
                // para no cargarle el HTML y romper los eventos.
                if (el.childNodes.length > 0) {
                    // Buscamos el primer nodo de tipo texto
                    let textNode = Array.from(el.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
                    if (textNode) {
                        textNode.textContent = translation;
                    } else {
                        // Si no hay nodo de texto (está vacío), lo creamos
                        el.textContent = translation;
                    }
                } else {
                    el.textContent = translation;
                }
            }
        });
    }
};

window.i18n = i18n;
document.addEventListener('DOMContentLoaded', () => i18n.load(i18n.currentLang));