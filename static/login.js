document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const messageElement = document.getElementById('loginMessage');

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({username, password }),
        });

        const data = await response.json();
        console.log(data);

        if (response.ok) {
            window.location.href = '/chat';
        } else {
            messageElement.textContent = data.msg || 'Login failed.';
        }
    } catch (error) {
        console.error('Login error:', error);
        messageElement.textContent = 'An error occurred during login.';
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    const messageElement = document.getElementById('registerMessage');

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        messageElement.textContent = data.msg;

        if (response.ok) {
            document.getElementById('registerForm').reset();
        }
    } catch (error) {
        console.error('Registration error:', error);
        messageElement.textContent = 'An error occurred during registration.';
    }
});