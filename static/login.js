async function hashPassword(password) {
    if (window.crypto && crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
        // Fallback to crypto-js
        return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
    }
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('Email and password are required');
        return;
    }

    try {
        const hashedPassword = await hashPassword(password);
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, hashedPassword })
        });

        if (response.ok) {
            const userData = await response.json();
            localStorage.setItem('user', JSON.stringify(userData.user));
            window.location.href = 'index.html';
        } else {
            const errorData = await response.json();
            alert(`Login failed: ${errorData.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Error during login');
    }
}

// Handle signup form submission
async function handleSignup(event) {
    event.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!name || !email || !password || !confirmPassword) {
        alert('All fields are required');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        const hashedPassword = await hashPassword(password);
        const response = await fetch('/api/create-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, hashedPassword })
        });

        if (response.ok) {
            alert('Account created successfully! Please log in.');
            switchTab('login');
            document.getElementById('loginEmail').value = email;
            document.getElementById('loginPassword').value = '';
        } else {
            const errorData = await response.json();
            alert(`Sign-up failed: ${errorData.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Signup error:', error);
        alert('Error during sign-up. Please try again later.');
    }
}

// Tab switching
function switchTab(tabName) {
    console.log('Switching to tab:', tabName)
    const tabs = document.querySelectorAll('.login-page .tab');
    const forms = document.querySelectorAll('.login-page .auth-form');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    forms.forEach(form => form.classList.add('hidden'));
    
    if (tabName === 'login') {
        document.querySelector('.login-page .tab:nth-child(1)').classList.add('active');
        document.getElementById('loginForm').classList.remove('hidden');
    } else {
        document.querySelector('.login-page .tab:nth-child(2)').classList.add('active');
        document.getElementById('signupForm').classList.remove('hidden');
    }
}

// Dark mode toggle
function setupDarkModeToggle() {
    const darkModeToggle = document.querySelector('.dark-mode-toggle');
    if (!darkModeToggle) return;

    darkModeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
        
        const icon = this.querySelector('i');
        if (document.body.classList.contains('dark-mode')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });
    
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        const icon = darkModeToggle.querySelector('i');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setupDarkModeToggle();
    
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (signupForm) signupForm.addEventListener('submit', handleSignup);
});