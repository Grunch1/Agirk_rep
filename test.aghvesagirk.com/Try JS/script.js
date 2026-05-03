document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.nav-btn');
    const main = document.querySelector('main');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const color = button.dataset.color;
            console.log(`Button clicked: ${color}`);
            changeContent(color);
        });
    });

    function changeContent(color) {
        const contentMap = {
            B: '<h1 class="B">Hello World! no.1</h1>',
            R: '<h1 class="R">Hello World! no.2</h1>',
            G: '<h1 class="G">Hello World! no.3</h1>',
            Y: '<h1 class="Y">Hello World! no.4</h1>'
        };

        console.log(`Changing content to color: ${color}`);
        main.innerHTML = contentMap[color];
    }
});
