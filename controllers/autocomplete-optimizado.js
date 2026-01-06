// public/javascripts/autocomplete-optimizado.js

class AutocompleteOptimizado {
    constructor(inputId, dataUrl, minChars = 2) {
        this.input = document.getElementById(inputId);
        this.dataUrl = dataUrl;
        this.minChars = minChars;
        this.cache = new Map();
        this.debounceTimer = null;
        this.debounceDelay = 300;

        this.init();
    }

    init() {
        if (!this.input) return;


        const container = document.createElement('div');
        container.className = 'autocomplete-suggestions';
        container.style.cssText = `
            position: absolute;
            border: 1px solid #d4d4d4;
            border-top: none;
            z-index: 99;
            top: 100%;
            left: 0;
            right: 0;
            max-height: 300px;
            overflow-y: auto;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        `;


        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        this.input.parentNode.insertBefore(wrapper, this.input);
        wrapper.appendChild(this.input);
        wrapper.appendChild(container);

        this.container = container;


        this.input.addEventListener('input', (e) => this.handleInput(e));
        this.input.addEventListener('focus', (e) => this.handleInput(e));


        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                this.container.style.display = 'none';
            }
        });
    }

    handleInput(e) {
        const value = e.target.value.trim();

        clearTimeout(this.debounceTimer);

        if (value.length < this.minChars) {
            this.container.style.display = 'none';
            return;
        }

        this.debounceTimer = setTimeout(() => {
            this.fetchSuggestions(value);
        }, this.debounceDelay);
    }

    async fetchSuggestions(query) {

        const cacheKey = query.toLowerCase();
        if (this.cache.has(cacheKey)) {
            this.showSuggestions(this.cache.get(cacheKey), query);
            return;
        }

        try {
            const response = await fetch(`${this.dataUrl}?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Error en la petición');

            const data = await response.json();


            this.cache.set(cacheKey, data);

            if (this.cache.size > 50) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }

            this.showSuggestions(data, query);
        } catch (error) {
            console.error('Error al obtener sugerencias:', error);
            this.container.innerHTML = '<div style="padding: 10px; color: #999;">Error al cargar sugerencias</div>';
        }
    }

    showSuggestions(items, query) {
        if (!items || items.length === 0) {
            this.container.innerHTML = '<div style="padding: 10px; color: #999;">No se encontraron resultados</div>';
            this.container.style.display = 'block';
            return;
        }


        const limitedItems = items.slice(0, 20);

        const html = limitedItems.map(item => {
            const text = typeof item === 'string' ? item : item.nombre || item.descripcion;
            const highlighted = this.highlightMatch(text, query);

            return `<div class="autocomplete-item" data-value="${text}" style="
                padding: 10px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
            ">${highlighted}</div>`;
        }).join('');

        this.container.innerHTML = html;
        this.container.style.display = 'block';


        this.container.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('mouseenter', (e) => {
                e.target.style.backgroundColor = '#f0f0f0';
            });
            item.addEventListener('mouseleave', (e) => {
                e.target.style.backgroundColor = 'white';
            });
            item.addEventListener('click', (e) => {
                this.input.value = e.target.dataset.value;
                this.container.style.display = 'none';
                this.input.focus();
            });
        });
    }

    highlightMatch(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<strong>$1</strong>');
    }
}


document.addEventListener('DOMContentLoaded', function () {

    ['medicamento1', 'medicamento2', 'medicamento3'].forEach(id => {
        if (document.getElementById(id)) {
            new AutocompleteOptimizado(id, '/api/medicamentos/search');
        }
    });


    ['principio_activo1', 'principio_activo2', 'principio_activo3'].forEach(id => {
        if (document.getElementById(id)) {
            new AutocompleteOptimizado(id, '/api/principios-activos/search');
        }
    });
});


function toggleAllGFH(formName) {
    const form = document.forms[formName];
    if (!form) return;

    const selectAllCheckbox = form.querySelector('#selectAll1');
    const checkboxes = form.querySelectorAll('input[name="gfh_ids"]');
    const isChecked = selectAllCheckbox.checked;


    requestAnimationFrame(() => {
        checkboxes.forEach(cb => cb.checked = isChecked);
    });
}