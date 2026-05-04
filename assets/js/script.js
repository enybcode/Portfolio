const elements = document.querySelectorAll(
    '.section, .card, .project, .timeline article, .profile-card, .block, .info-box'
);

elements.forEach(element => {
    element.classList.add('reveal');
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.12
});

elements.forEach(element => observer.observe(element));


// Ouverture / fermeture du CV sans l'afficher directement dans la page
const openCvBtn = document.getElementById('openCvBtn');
const closeCvBtn = document.getElementById('closeCvBtn');
const cvModal = document.getElementById('cvModal');

if (openCvBtn && closeCvBtn && cvModal) {
    openCvBtn.addEventListener('click', () => {
        cvModal.classList.add('active');
        cvModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('cv-open');
    });

    closeCvBtn.addEventListener('click', () => {
        cvModal.classList.remove('active');
        cvModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('cv-open');
    });

    cvModal.addEventListener('click', (event) => {
        if (event.target === cvModal) {
            cvModal.classList.remove('active');
            cvModal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('cv-open');
        }
    });
}


// Ouverture / fermeture du mini-jeu dans une fenêtre intégrée
const openGameBtn = document.getElementById('openGameBtn');
const closeGameBtn = document.getElementById('closeGameBtn');
const gameModal = document.getElementById('gameModal');

if (openGameBtn && closeGameBtn && gameModal) {
    openGameBtn.addEventListener('click', () => {
        gameModal.classList.add('active');
        gameModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('game-open');
    });

    closeGameBtn.addEventListener('click', () => {
        gameModal.classList.remove('active');
        gameModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('game-open');
    });

    gameModal.addEventListener('click', (event) => {
        if (event.target === gameModal) {
            gameModal.classList.remove('active');
            gameModal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('game-open');
        }
    });
}
