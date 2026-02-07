// Register page logic
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const nextBtn = document.getElementById('nextBtn');
    const verificationModal = document.getElementById('verificationModal');
    const questionsDiv = document.getElementById('questions');
    const submitVerificationBtn = document.getElementById('submitVerification');
    const errorMessage = document.getElementById('errorMessage');
    const avatarGrid = document.getElementById('avatarGrid');
    const phoneInput = document.getElementById('phone');
    
    let selectedAvatar = 1;
    let verificationQuestions = [];
    
    // Create avatar grid (27 avatars)
    for (let i = 1; i <= 27; i++) {
        const avatarImg = document.createElement('img');
        avatarImg.src = `/images/avatar-${i}.png`;
        avatarImg.alt = `Avatar ${i}`;
        avatarImg.className = 'avatar-option';
        avatarImg.dataset.id = i;
        
        if (i === 1) {
            avatarImg.classList.add('selected');
        }
        
        avatarImg.addEventListener('click', () => {
            document.querySelectorAll('.avatar-option').forEach(a => a.classList.remove('selected'));
            avatarImg.classList.add('selected');
            selectedAvatar = i;
        });
        
        avatarGrid.appendChild(avatarImg);
    }
    
    // Phone input formatting
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (!value.startsWith('994')) {
            value = '994' + value;
        }
        if (value.length > 12) {
            value = value.slice(0, 12);
        }
        e.target.value = '+' + value;
    });
    
    phoneInput.addEventListener('focus', (e) => {
        if (!e.target.value) {
            e.target.value = '+994';
        }
    });
    
    // Next button - show verification
    nextBtn.addEventListener('click', async () => {
        // Validate all fields
        const email = document.getElementById('email').value;
        const phone = phoneInput.value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!email.endsWith('@bsu.edu.az')) {
            return showError('Email @bsu.edu.az ilə bitməlidir');
        }
        
        if (!/^\+994\d{9}$/.test(phone)) {
            return showError('Telefon nömrəsi +994XXXXXXXXX formatında olmalıdır');
        }
        
        if (password.length < 6) {
            return showError('Şifrə minimum 6 simvol olmalıdır');
        }
        
        if (password !== confirmPassword) {
            return showError('Şifrələr uyğun gəlmir');
        }
        
        // Get verification questions
        try {
            const response = await fetch('/api/verification-questions');
            verificationQuestions = await response.json();
            
            // Display questions
            questionsDiv.innerHTML = '';
            verificationQuestions.forEach((q, index) => {
                const questionBlock = document.createElement('div');
                questionBlock.className = 'question-block';
                questionBlock.innerHTML = `
                    <label>${index + 1}. ${q.question}</label>
                    <select data-index="${index}">
                        <option value="">Cavab seçin</option>
                        ${q.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                    </select>
                `;
                questionsDiv.appendChild(questionBlock);
            });
            
            verificationModal.classList.add('show');
        } catch (error) {
            console.error('Get questions error:', error);
            showError('Xəta baş verdi');
        }
    });
    
    // Submit verification and register
    submitVerificationBtn.addEventListener('click', async () => {
        const answers = [];
        const selects = questionsDiv.querySelectorAll('select');
        
        let allAnswered = true;
        selects.forEach((select, index) => {
            if (!select.value) {
                allAnswered = false;
            }
            answers.push({
                question: verificationQuestions[index].question,
                answer: select.value
            });
        });
        
        if (!allAnswered) {
            return showError('Bütün suallara cavab verin');
        }
        
        // Register user
        const formData = {
            email: document.getElementById('email').value,
            phone: phoneInput.value,
            password: document.getElementById('password').value,
            full_name: document.getElementById('fullName').value,
            faculty: document.getElementById('faculty').value,
            degree: document.getElementById('degree').value.toLowerCase(),
            course: parseInt(document.getElementById('course').value),
            avatar_id: selectedAvatar,
            verification: answers
        };
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Qeydiyyat uğurla tamamlandı! İndi giriş edə bilərsiniz.');
                window.location.href = '/';
            } else {
                verificationModal.classList.remove('show');
                showError(data.error || 'Qeydiyyat uğursuz oldu');
            }
        } catch (error) {
            console.error('Register error:', error);
            verificationModal.classList.remove('show');
            showError('Xəta baş verdi');
        }
    });
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        setTimeout(() => errorMessage.classList.remove('show'), 3000);
    }
});
