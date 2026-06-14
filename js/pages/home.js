document.addEventListener('DOMContentLoaded', () => {

    const avatar = document.getElementById('welcomeAvatar');

    if (avatar && typeof OsirisAuth !== 'undefined') {

        avatar.src = OsirisAuth.getPhotoURL();

        avatar.alt = OsirisAuth.getSession()?.name || '';

    }

    window.addEventListener('osiris-auth-change', () => {

        if (avatar) {

            avatar.src = OsirisAuth.getPhotoURL();

            avatar.alt = OsirisAuth.getSession()?.name || '';

        }

    });

});


