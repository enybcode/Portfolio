const pages = document.querySelectorAll(".page");

window.addEventListener("scroll", function () {
    pages.forEach(function (page) {
        const position = page.getBoundingClientRect().top;
        const screenHeight = window.innerHeight;

        if (position < screenHeight - 100) {
            page.style.transform = "rotateY(0deg) scale(1)";
            page.style.opacity = "1";
        }
    });
});

for (let i = 0; i < pages.length; i++) {
    pages[i].style.transition = "0.6s";
    pages[i].style.opacity = "0.9";
    pages[i].style.transform = "scale(0.98)";
}
