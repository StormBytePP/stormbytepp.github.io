document.addEventListener('DOMContentLoaded', () => {
    // Animation for text
    const textElements = document.querySelectorAll('h1, h2, p, li');
    textElements.forEach((element, index) => {
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, 200 * index);
    });

    // Calculate and display age
    const birthDate = new Date(1984, 3, 23); // April 23, 1984 (month is 0-indexed)
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    document.getElementById('age').textContent = age;

    // Matrix effect
    const matrixCanvas = document.getElementById('matrix');
    const ctx = matrixCanvas.getContext('2d');
    const matrixChars = 'あいうえおカキクケコשזסカヒサレדגזךευλνοπρτφωψαςδ中文字符もう夜明けだ'.split(''); // Includes Hiragana, Katakana, Hebrew, Greek, Cyrillic, Chinese, and more
    const fontSize = 16;
    const min_speed = 2;  // Lower minimum speed
    const max_speed = 25; // Higher maximum speed
    let columns;
    let drops = [];
    let speeds = [];

    function resizeCanvas() {
        matrixCanvas.width = window.innerWidth;
        matrixCanvas.height = window.innerHeight;
        columns = Math.floor(matrixCanvas.width / fontSize);
        const centerX = matrixCanvas.width / 2;
        const maxDistance = Math.max(centerX, window.innerHeight / 2);
        drops = Array.from({ length: columns }, () => Math.floor(Math.random() * matrixCanvas.height / fontSize));
        speeds = Array.from({ length: columns }, (_, i) => {
            const distanceFromCenter = Math.abs(i * fontSize - centerX);
            const speedFactor = Math.pow(1 - (distanceFromCenter / maxDistance), 2); // Increase the bias
            return (min_speed + (max_speed - min_speed) * speedFactor); // Speed decreases with distance from center
        });
    }

    function drawMatrix() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
        ctx.fillStyle = '#00FF00';
        ctx.font = fontSize + 'px Courier New';

        for (let i = 0; i < drops.length; i++) {
            const text = matrixChars[Math.floor(Math.random() * matrixChars.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }

            drops[i] += speeds[i] / fontSize; // Use different speeds for each column
        }
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    setInterval(drawMatrix, 50);

    // Navbar toggle for small screens
    const toggleButton = document.querySelector('.toggle-button');
    const navLinks = document.querySelector('nav ul');

    toggleButton.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Animate skill bars
    const skillBars = document.querySelectorAll('.skill-bar');
    skillBars.forEach(bar => {
        const width = bar.getAttribute('data-width');
        bar.style.width = width;
    });

    // Typewriter effect for name
    const nameElement = document.querySelector('header .name');
    const nameText = nameElement.textContent;
    nameElement.textContent = ''; // Clear the text initially
    let index = 0;

    function typeWriter() {
        if (index < nameText.length) {
            nameElement.textContent += nameText.charAt(index);
            index++;
            setTimeout(typeWriter, 100); // Delay between each letter (in milliseconds)
        } else {
            nameElement.style.borderRight = 'none'; // Remove cursor after typing is complete
        }
    }

    // Add cursor style
    nameElement.style.borderRight = '0.15em solid #00FF00';
    nameElement.style.display = 'inline-block';

    // Start the typewriter effect
    typeWriter();
});
