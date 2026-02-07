// Login page logic
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    
    // Check if current page is admin login
    const isAdminLogin = window.location.pathname.includes('admin') || document.querySelector('h1').textContent.includes('Admin');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const identifier = document.getElementById('identifier').value.trim();
        const password = document.getElementById('password').value;
        
        try {
            const endpoint = isAdminLogin ? '/api/admin/login' : '/api/login';
            const body = isAdminLogin ? 
                { username: identifier, password } : 
                { email: identifier, password };
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            
            const data = await response.json();
            
            if (data.success) {
                if (isAdminLogin) {
                    window.location.href = '/admin.html';
                } else {
                    localStorage.setItem('userId', data.user.id);
                    localStorage.setItem('userData', JSON.stringify(data.user));
                    window.location.href = '/chat.html';
                }
            } else {
                showError(data.error || 'Giriş uğursuz oldu');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Xəta baş verdi');
        }
    });
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        setTimeout(() => errorMessage.classList.remove('show'), 3000);
    }
});
