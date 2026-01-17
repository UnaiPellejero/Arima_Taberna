class Footer extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <footer>
            <div class="footer-content">
                <div class="footer-section">
                    <h3 data-i18n="footer.contacto">Contacto</h3>
                    <p><strong data-i18n="footer.telefono">Teléfono:</strong> +34 000 000 000</p>
                    <p><strong data-i18n="footer.email">Email:</strong> <a href="mailto:arima@arimataberna.eus">arima@arimataberna.eus</a></p>
                    <p data-i18n="footer.abierto">Abierto todos los días</p>
                </div>
                
                <div class="footer-section">
                    <h3 data-i18n="footer.ubicacion">Nuestra Ubicación</h3>
                    <p data-i18n="footer.direccion">Osina kalea 4, Zabaleta Berri auzoa, Lasarte-Oria, 20160</p>
                    <div class="map-container">
                        <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2171.344902566362!2d-2.0141056821024903!3d43.27023448528147!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd51b106003978af%3A0x268ca7871c20f097!2sArima%20Taberna!5e0!3m2!1ses!2ses!4v1768380402612!5m2!1ses!2ses" 
                        width="600" height="450" title="Mapa Arima Taberna" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade">
                        </iframe>
                    </div>
                </div>

                <div class="footer-section">
                    <h3 data-i18n="footer.siguenos">Síguenos</h3>
                    <div class="social-links">
                        <a href="https://www.facebook.com/people/Arima-Gastrotaberna/100088189659183/" target="_blank"><i class="fab fa-facebook"></i></a>
                        <a href="https://www.instagram.com/arimataberna/" target="_blank"><i class="fab fa-instagram"></i></a>
                    </div>
                </div>
            </div>

            <div class="footer-bottom" data-i18n="footer.derechos">
                © 2022 Arima Taberna. Todos los derechos reservados.
            </div>
        </footer>
        `;

         if (window.i18n && i18n.translations && Object.keys(i18n.translations).length > 0) {
            i18n.translatePage();
        }
    }
}

if (!customElements.get('index-footer')) {
    customElements.define('index-footer', Footer);
}