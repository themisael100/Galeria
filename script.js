import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getStorage, ref, listAll, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

      const firebaseConfig = {
        apiKey: "AIzaSyAStL-pHloLPTXrOvS3-JXz6LBofi9Us6s",
        authDomain: "tareasdeempleados.firebaseapp.com",
        projectId: "tareasdeempleados",
        storageBucket: "tareasdeempleados.appspot.com",
        messagingSenderId: "970474430818",
        appId: "1:970474430818:web:5d37d352afa157c1cb4c3b",
      };

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);


const subcategories = {
    ciencia: [
        { id: 'todas', name: 'Todas' },
        { id: 'ganadoras', name: 'Ganadoras' }
    ],
    innovacion: [
        { id: 'todas', name: 'Todas' },
        { id: 'ganadoras', name: 'Ganadoras' }
    ],
    naturaleza: [
        { id: 'todas', name: 'Todas' },
        { id: 'ganadoras', name: 'Ganadoras' }
    ]
};

let allImages = [];
let currentCategory = 'all';
let currentSubcategory = 'todas';
let currentPage = 0;
const imagesPerPage = 8;
let currentImageIndex = 0;
let filteredImages = [];

async function loadImages() {
    const contentDiv = document.getElementById('content');
    
    try {
        allImages = [];
        
        const categories = ['ciencia', 'innovacion', 'naturaleza'];
        
        for (const category of categories) {
            // Cargar imágenes de cada subcategoría
            for (const subcat of subcategories[category]) {
                const listRef = ref(storage, `gallery/${category}/${subcat.id}/`);
                try {
                    const result = await listAll(listRef);
                    
                    for (const itemRef of result.items) {
                        const url = await getDownloadURL(itemRef);
                        allImages.push({
                            url: url,
                            name: itemRef.name,
                            category: category,
                            subcategory: subcat.id
                        });
                    }
                } catch (error) {
                    console.log(`No se encontraron imágenes en ${category}/${subcat.id}`);
                }
            }
        }

        if (allImages.length === 0) {
            contentDiv.innerHTML = `
                <div style="text-align: center; padding: 40px; background: white; border-radius: 10px;">
                    <h2>⚠️ No se encontraron imágenes</h2>
                    <p>Sube imágenes siguiendo la estructura de carpetas indicada</p>
                </div>
            `;
            return;
        }

        displayGallery();

    } catch (error) {
        console.error('Error:', error);
        contentDiv.innerHTML = `
            <div style="text-align: center; padding: 40px; background: white; border-radius: 10px; color: #d32f2f;">
                <h2>❌ Error al cargar la galería</h2>
                <p><strong>Mensaje:</strong> ${error.message}</p>
                <p>Verifica tu configuración de Firebase</p>
            </div>
        `;
    }
}

function updateSubcategories() {
    const subcategoriesDiv = document.getElementById('subcategories');
    
    if (currentCategory === 'all') {
        subcategoriesDiv.classList.remove('show');
        return;
    }

    const subcats = subcategories[currentCategory];
    subcategoriesDiv.innerHTML = subcats.map(sub => `
        <button class="subcategory-btn ${sub.id === currentSubcategory ? 'active' : ''}" 
                data-subcategory="${sub.id}">
            ${sub.name}
        </button>
    `).join('');

    subcategoriesDiv.classList.add('show');

    // Agregar eventos a los botones de subcategoría
    document.querySelectorAll('.subcategory-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.subcategory-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentSubcategory = this.dataset.subcategory;
            currentPage = 0;
            displayGallery();
        });
    });
}

function displayGallery() {
    // Filtrar imágenes según categoría y subcategoría
    if (currentCategory === 'all') {
        filteredImages = allImages;
    } else {
        filteredImages = allImages.filter(img => 
            img.category === currentCategory && 
            img.subcategory === currentSubcategory
        );
    }

    const startIndex = currentPage * imagesPerPage;
    const endIndex = startIndex + imagesPerPage;
    const imagesToShow = filteredImages.slice(startIndex, endIndex);

    const contentDiv = document.getElementById('content');
    const galleryHTML = '<div class="gallery">' + 
        imagesToShow.map((img, index) => `
            <div class="gallery-item" onclick="openModal(${startIndex + index})">
                <img src="${img.url}" alt="${img.name}" loading="lazy">
            </div>
        `).join('') +
        '</div>';

    contentDiv.innerHTML = galleryHTML;

    // Actualizar paginación
    const paginationDiv = document.getElementById('pagination');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');
    
    const totalPages = Math.ceil(filteredImages.length / imagesPerPage);
    
    if (totalPages > 1) {
        paginationDiv.style.display = 'flex';
        prevBtn.disabled = currentPage === 0;
        nextBtn.disabled = currentPage >= totalPages - 1;
        
        pageInfo.textContent = `Página ${currentPage + 1} de ${totalPages}`;
    } else {
        paginationDiv.style.display = 'none';
        pageInfo.textContent = '';
    }
}

window.openModal = function(index) {
    currentImageIndex = index;
    document.getElementById('modal').classList.add('active');
    updateModalImage();
}

window.closeModal = function() {
    document.getElementById('modal').classList.remove('active');
}

window.changeImage = function(direction) {
    currentImageIndex += direction;
    if (currentImageIndex < 0) {
        currentImageIndex = filteredImages.length - 1;
    } else if (currentImageIndex >= filteredImages.length) {
        currentImageIndex = 0;
    }
    updateModalImage();
}

function updateModalImage() {
    const img = document.getElementById('modalImg');
    img.src = filteredImages[currentImageIndex].url;
}

// Eventos de teclado
document.addEventListener('keydown', function(e) {
    const modal = document.getElementById('modal');
    if (modal.classList.contains('active')) {
        if (e.key === 'Escape') {
            closeModal();
        } else if (e.key === 'ArrowLeft') {
            changeImage(-1);
        } else if (e.key === 'ArrowRight') {
            changeImage(1);
        }
    }
});

// Cerrar modal al hacer clic fuera
document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal();
    }
});

// Botones de paginación
document.getElementById('prevBtn').addEventListener('click', function() {
    if (currentPage > 0) {
        currentPage--;
        displayGallery();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

document.getElementById('nextBtn').addEventListener('click', function() {
    const totalPages = Math.ceil(filteredImages.length / imagesPerPage);
    if (currentPage < totalPages - 1) {
        currentPage++;
        displayGallery();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

// Botones de categoría principal
document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentCategory = this.dataset.category;
        currentSubcategory = 'todas';
        currentPage = 0;
        updateSubcategories();
        displayGallery();
    });
});

// Inicializar
loadImages();