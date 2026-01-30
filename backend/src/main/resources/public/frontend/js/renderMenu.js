import { menuArima } from './menu.js';

const platosContainer = document.getElementById('platos');
const sidebarContainer = document.getElementById('sidebar-links');

function renderizarTodo() {
    menuArima.forEach(categoria => {
        // 1. Crear la sección del Menú
        const seccion = document.createElement('section');
        seccion.id = categoria.id; // Aquí se asigna el ID (ej: "desayuno", "postres")
        seccion.className = 'menu-category';
        
        seccion.innerHTML = `
            <h2 class="menu-titulo" data-i18n="${categoria.i18n}">${categoria.titulo}</h2>
            <div class="img-contenedor">
                <img src="${categoria.img}" alt="${categoria.titulo}" class="img-plato">
            </div>
            <div class="lista-platos">
                ${categoria.platos.map(plato => `
                    <div class="plato">
                        <span class="titulo" data-i18n="${plato.i18n}">${plato.nombre}</span>
                        <span class="precio">${plato.precio}</span>
                    </div>
                `).join('')}
            </div>
        `;
        platosContainer.appendChild(seccion);

        // 2. Crear el enlace en la Barra Lateral
        const li = document.createElement('li');
        li.innerHTML = `
            <a href="#${categoria.id}">
                <span class="circulo-sidebar"></span>
                <span data-i18n="${categoria.i18n}">${categoria.titulo}</span>
            </a>
        `;
        sidebarContainer.appendChild(li);
    });
}

renderizarTodo();