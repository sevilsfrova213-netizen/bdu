// Admin panel logic
document.addEventListener('DOMContentLoaded', async () => {
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Tab switching
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            navBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // Load data for tab
            loadTabData(tabId);
        });
    });
    
    // Logout
    logoutBtn.addEventListener('click', () => {
        window.location.href = '/';
    });
    
    // Check if super admin
    const response = await fetch('/api/admin/sub-admins');
    const isSuperAdmin = response.ok;
    if (isSuperAdmin) {
        document.querySelectorAll('.super-only').forEach(el => el.style.display = 'block');
    }
    
    // Load initial data
    loadTabData('dashboard');
    
    // Daily topic
    document.getElementById('saveDailyTopic').addEventListener('click', async () => {
        const value = document.getElementById('dailyTopicInput').value;
        await saveSetting('daily_topic', value);
        alert('Günün mövzusu yadda saxlanıldı');
    });
    
    // Filter words
    document.getElementById('saveFilterWords').addEventListener('click', async () => {
        const value = document.getElementById('filterWordsInput').value;
        await saveSetting('filter_words', value);
        alert('Filtr sözləri yadda saxlanıldı');
    });
    
    // Rules
    document.getElementById('saveRules').addEventListener('click', async () => {
        const value = document.getElementById('rulesInput').value;
        await saveSetting('rules', value);
        alert('Qaydalar yadda saxlanıldı');
    });
    
    // About
    document.getElementById('saveAbout').addEventListener('click', async () => {
        const value = document.getElementById('aboutInput').value;
        await saveSetting('about', value);
        alert('Haqqında məlumatı yadda saxlanıldı');
    });
    
    // Group message time
    document.getElementById('saveGroupTime').addEventListener('click', async () => {
        const time = document.getElementById('groupTime').value;
        const unit = document.getElementById('groupUnit').value;
        await saveSetting('group_message_delete_time', time);
        await saveSetting('group_message_delete_unit', unit);
        alert('Qrup mesaj silmə vaxtı yadda saxlanıldı');
    });
    
    // Private message time
    document.getElementById('savePrivateTime').addEventListener('click', async () => {
        const time = document.getElementById('privateTime').value;
        const unit = document.getElementById('privateUnit').value;
        await saveSetting('private_message_delete_time', time);
        await saveSetting('private_message_delete_unit', unit);
        alert('Şəxsi mesaj silmə vaxtı yadda saxlanıldı');
    });
    
    // Create sub-admin
    document.getElementById('createAdmin').addEventListener('click', async () => {
        const username = document.getElementById('newAdminUsername').value;
        const password = document.getElementById('newAdminPassword').value;
        
        if (!username || !password) {
            return alert('Bütün xanaları doldurun');
        }
        
        try {
            const response = await fetch('/api/admin/sub-admins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            if (data.success) {
                alert('Alt admin yaradıldı');
                document.getElementById('newAdminUsername').value = '';
                document.getElementById('newAdminPassword').value = '';
                loadTabData('admins');
            } else {
                alert(data.error || 'Xəta baş verdi');
            }
        } catch (error) {
            console.error('Create admin error:', error);
            alert('Xəta baş verdi');
        }
    });
    
    async function loadTabData(tabId) {
        switch (tabId) {
            case 'dashboard':
                await loadReportedUsers();
                break;
            case 'users':
                await loadAllUsers();
                break;
            case 'daily-topic':
                await loadSetting('daily_topic', 'dailyTopicInput');
                break;
            case 'filter':
                await loadSetting('filter_words', 'filterWordsInput');
                break;
            case 'rules':
                await loadSetting('rules', 'rulesInput');
                break;
            case 'about':
                await loadSetting('about', 'aboutInput');
                break;
            case 'messages':
                await loadMessageSettings();
                break;
            case 'admins':
                await loadSubAdmins();
                break;
        }
    }
    
    async function loadReportedUsers() {
        try {
            const response = await fetch('/api/admin/reported-users');
            const data = await response.json();
            const list = document.getElementById('reportedUsersList');
            
            if (data.users && data.users.length > 0) {
                list.innerHTML = data.users.map(user => `
                    <div class="user-card">
                        <div class="user-info">
                            <h3>${user.full_name}</h3>
                            <p>📧 ${user.email}</p>
                            <p>📱 ${user.phone}</p>
                            <p>🎓 ${user.faculty} - ${user.degree} ${user.course}</p>
                            <p style="color: #f44336; font-weight: 600;">⚠️ ${user.report_count} şikayət</p>
                        </div>
                        <div class="user-actions">
                            <button class="btn-toggle ${user.is_active ? '' : 'inactive'}" onclick="toggleUser(${user.id})">
                                ${user.is_active ? 'Deaktiv et' : 'Aktiv et'}
                            </button>
                        </div>
                    </div>
                `).join('');
            } else {
                list.innerHTML = '<div class="empty-state"><p>Heç bir təhlükəli hesab yoxdur</p></div>';
            }
        } catch (error) {
            console.error('Load reported users error:', error);
        }
    }
    
    async function loadAllUsers() {
        try {
            const response = await fetch('/api/admin/users');
            const data = await response.json();
            const list = document.getElementById('usersList');
            
            document.getElementById('totalUsers').textContent = data.users.length;
            
            if (data.users && data.users.length > 0) {
                list.innerHTML = data.users.map(user => `
                    <div class="user-card">
                        <div class="user-info">
                            <h3>${user.full_name}</h3>
                            <p>📧 ${user.email}</p>
                            <p>📱 ${user.phone}</p>
                            <p>🎓 ${user.faculty} - ${user.degree} ${user.course}</p>
                            <p>📅 ${new Date(user.created_at).toLocaleDateString('az-AZ')}</p>
                        </div>
                        <div class="user-actions">
                            <button class="btn-toggle ${user.is_active ? '' : 'inactive'}" onclick="toggleUser(${user.id})">
                                ${user.is_active ? 'Deaktiv et' : 'Aktiv et'}
                            </button>
                        </div>
                    </div>
                `).join('');
            } else {
                list.innerHTML = '<div class="empty-state"><p>Heç bir istifadəçi yoxdur</p></div>';
            }
        } catch (error) {
            console.error('Load users error:', error);
        }
    }
    
    async function loadSubAdmins() {
        try {
            const response = await fetch('/api/admin/sub-admins');
            const data = await response.json();
            const list = document.getElementById('adminsList');
            
            if (data.admins && data.admins.length > 0) {
                list.innerHTML = data.admins.map(admin => `
                    <div class="user-card">
                        <div class="user-info">
                            <h3>${admin.username}</h3>
                            <p>📅 ${new Date(admin.created_at).toLocaleDateString('az-AZ')}</p>
                        </div>
                        <div class="user-actions">
                            <button class="btn-delete" onclick="deleteAdmin(${admin.id})">Sil</button>
                        </div>
                    </div>
                `).join('');
            } else {
                list.innerHTML = '<div class="empty-state"><p>Heç bir alt admin yoxdur</p></div>';
            }
        } catch (error) {
            console.error('Load sub-admins error:', error);
        }
    }
    
    async function loadSetting(key, inputId) {
        try {
            const response = await fetch(`/api/settings/${key}`);
            const data = await response.json();
            document.getElementById(inputId).value = data.value || '';
        } catch (error) {
            console.error('Load setting error:', error);
        }
    }
    
    async function loadMessageSettings() {
        try {
            const groupTime = await fetch('/api/settings/group_message_delete_time').then(r => r.json());
            const groupUnit = await fetch('/api/settings/group_message_delete_unit').then(r => r.json());
            const privateTime = await fetch('/api/settings/private_message_delete_time').then(r => r.json());
            const privateUnit = await fetch('/api/settings/private_message_delete_unit').then(r => r.json());
            
            document.getElementById('groupTime').value = groupTime.value || '60';
            document.getElementById('groupUnit').value = groupUnit.value || 'minutes';
            document.getElementById('privateTime').value = privateTime.value || '60';
            document.getElementById('privateUnit').value = privateUnit.value || 'minutes';
        } catch (error) {
            console.error('Load message settings error:', error);
        }
    }
    
    async function saveSetting(key, value) {
        try {
            await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value })
            });
        } catch (error) {
            console.error('Save setting error:', error);
        }
    }
    
    // Global functions
    window.toggleUser = async (userId) => {
        try {
            await fetch(`/api/admin/users/${userId}/toggle`, { method: 'POST' });
            loadTabData(document.querySelector('.nav-btn.active').dataset.tab);
        } catch (error) {
            console.error('Toggle user error:', error);
        }
    };
    
    window.deleteAdmin = async (adminId) => {
        if (!confirm('Əminsiniz?')) return;
        
        try {
            await fetch(`/api/admin/sub-admins/${adminId}`, { method: 'DELETE' });
            loadTabData('admins');
        } catch (error) {
            console.error('Delete admin error:', error);
        }
    };
});
