class Footer extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <footer>
            <p>
                &copy; 2022 ARIMA TABERNA. Osina kalea 4, Zabaleta Berri auzoa, Lasarte-Oria, 20160
            </p>
        </footer>
        `;
    }
}

if (!customElements.get('index-footer')) {
    customElements.define('index-footer', Footer);
}