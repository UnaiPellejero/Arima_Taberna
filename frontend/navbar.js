class Navbar extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
        <header>
            <nav>
                <div class="logo">
                    <a href="index.html">
                        <img src="utils/img/-7.webp" alt="logo del restaurante">
                    </a>
                </div>
                <ul>
                    <li class="nav-item"><a href="index.html">Inicio</a></li>
                    <li class="nav-item"><a href="aboutus.html">Quienes somos</a></li>
                    <li class="nav-item"><a href="contacto.html">Contacto</a></li>
                    <li class="nav-item"><a href="reservas.html">Reservas</a></li>
                </ul>
            </nav>
        </header>
        `;
    }
}

if (!customElements.get('main-navbar')) {
    customElements.define('main-navbar', Navbar);
}