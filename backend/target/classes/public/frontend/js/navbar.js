class Navbar extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <header>
            <nav class="navbar-container">
                <div class="logo">
                    <a href="index.html">
                        <img src="utils/img/Logo sin fondo.png" alt="logo">
                    </a>
                </div>
               
                
                <ul class="nav-list">
                    <li class="nav-item"><a href="index.html" data-i18n="nav.inicio">Inicio</a></li>
                    <li class="nav-item"><a href="aboutus.html" data-i18n="nav.somos">Quienes somos</a></li>
                    <li class="nav-item"><a href="contacto.html" data-i18n="nav.contacto">Contacto</a></li>
                    <li class="nav-item">
                        <a href="index.html#reservas" data-i18n="nav.reservas" class="btn-reserva">Reservas</a>
                    </li>
                    <div class="lang-switcher">
                        <button onclick="i18n.load('es')">ES</button>
                        <button onclick="i18n.load('eu')">EU</button>
                        <a href="#" id="abrir-auth">
                            <img src="utils/img/usuario.png" alt="user icon" class="user-icon">
                        </a>    
                    </div>
                    
                </ul>
            </nav>
        </header>
        `;
       /*  <a href="index.html" class="user-link">
                        <img src="utils/img/usuario.png" alt="user icon" class="user-icon">
                    </a>
        if (window.i18n && i18n.translations && Object.keys(i18n.translations).length > 0) {
            i18n.translatePage();
        } */
    }
}

if (!customElements.get('main-navbar')) {
    customElements.define('main-navbar', Navbar);
}