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
