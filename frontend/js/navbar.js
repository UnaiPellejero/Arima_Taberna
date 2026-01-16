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
                <li class="nav-item"><a href="index.html">Inicio</a></li>
                <li class="nav-item"><a href="aboutus.html">Quienes somos</a></li>
                <li class="nav-item"><a href="contacto.html">Contacto</a></li>
                <li class="nav-item">
                    <a href="index.html#reservas" class="btn-reserva">Reservas</a>
                </li>
                <div class="lang-switcher">
                    <button onclick="i18n.load('es')">ES</button>
                    <button onclick="i18n.load('eu')">EU</button>
                </div>
                </ul>
            </nav>
        </header>
        `;
        if(window.i18n) i18n.translatePage();
    }
}

if (!customElements.get('main-navbar')) {
    customElements.define('main-navbar', Navbar);
}