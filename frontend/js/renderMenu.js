import { menuArima } from './menu.js';

function renderMenu() {
    const contenedorPlatos = document.getElementById('platos');
    if (!contenedorPlatos) return;

    let htmlContent = '';

    menuArima.forEach(categoria => {
        htmlContent += `
            <article class="menu-category">
                <header>
                    <h2 data-i18n="${categoria.i18n}" class="menu-titulo" id="${categoria.id}">
                        ${categoria.titulo}
                    </h2>
                    <div class="img-contenedor">
                        <img class="img-plato" src="${categoria.img}" alt="${categoria.titulo.toLowerCase()}">
                    </div>
                </header>
                <div class="platos ${categoria.claseGrid} grid-menu">
                    ${categoria.platos.map(plato => `
                        <div class="plato">
                            <h3 class="titulo" data-i18n="${plato.i18n}">${plato.nombre}</h3>
                            <p class="precio">${plato.precio}</p>
                        </div>
                    `).join('')}
                </div>
            </article>
        `;
    });

    contenedorPlatos.innerHTML = htmlContent;

    if (window.translatePage) {
        window.translatePage();
    }
}

document.addEventListener('DOMContentLoaded', renderMenu);