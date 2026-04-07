const links = document.querySelectorAll("nav ul li a");

for (let i = 0; i < links.length; i++) {
    links[i].addEventListener("click", function () {
        console.log("Navigation vers : " + links[i].getAttribute("href"));
    });
}
