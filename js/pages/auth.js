/** Landing page particles */
document.addEventListener('DOMContentLoaded', () => {
    const bg = document.getElementById('landingBg');
    if (!bg) return;
    for (let i = 0; i < 24; i++) {
        const p = document.createElement('span');
        p.className = 'landing-bg__particle';
        p.style.left = `${Math.random() * 100}%`;
        p.style.animationDelay = `${Math.random() * 8}s`;
        p.style.animationDuration = `${6 + Math.random() * 6}s`;
        bg.appendChild(p);
    }
});
