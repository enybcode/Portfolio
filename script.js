const liens = document.querySelectorAll("nav a");

liens.forEach(function(lien) {
    lien.addEventListener("click", function() {
        console.log("Navigation vers " + lien.getAttribute("href"));
    });
});
