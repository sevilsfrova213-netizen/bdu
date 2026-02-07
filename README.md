# BSU Chat Platform

Bakı Dövlət Universiteti tələbələri üçün real-time chat platforması.

## 🎓 Layihə Haqqında

BSU Chat - 16 fakültə üçün ayrı-ayrılıqda chat otaqları, şəxsi mesajlaşma, admin paneli və çoxsaylı təhlükəsizlik funksiyaları olan müasir mesajlaşma platformasıdır.

## ⚠️ VACIB QEYDLƏR

### Database Konfiqurasiyası
- Database bağlantısı üçün `.env` faylında `DATABASE_URL` parametri düzgün olmalıdır
- Render.com-da database yaratdıqdan sonra düzgün credentials istifadə edin
- İlk dəfə deploy edəndə `database.sql` faylını Render PostgreSQL-də icra edin

### Render.com Deploy
1. GitHub repository-ni Render.com-a bağlayın
2. **Web Service** yaradın (Node.js)
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. Environment Variables əlavə edin:
   - `DATABASE_URL`: PostgreSQL connection string
   - `SESSION_SECRET`: Təsadüfi secure key
   - `NODE_ENV`: production
6. Database.sql faylını Render PostgreSQL console-da icra edin

### İlk İstifadə
1. Admin panelə giriş:
   - Username: `618ursamajor618`
   - Password: `majorursa618`
2. Database table-lərini yaratmaq üçün `database.sql` icra edin
3. Qaydalar və Haqqında bölmələrini doldurun
4. Test istifadəçi yaradın

## 🚀 URLs

### Development (Sandbox)
- **Frontend**: https://3000-iuap7mjbz5d7mh1cxzc6u-ad490db5.sandbox.novita.ai/
- **Admin Panel**: https://3000-iuap7mjbz5d7mh1cxzc6u-ad490db5.sandbox.novita.ai/admin-login.html
- **GitHub**: https://github.com/sevilsfrova213-netizen/bdu

### Production (Render.com)
Deploy etdikdən sonra buraya əlavə olunacaq

## ✨ Əsas Xüsusiyyətlər

### İstifadəçi Funksiyaları
- **16 Fakültə Otağı**: Hər fakültə üçün ayrı qrup chat otağı
- **Şəxsi Mesajlaşma**: İstifadəçilər arasında 1-1 mesajlaşma
- **Avatar Sistemi**: 27 fərqli avatar seçimi
- **Doğrulama Sistemi**: Qeydiyyat zamanı korpus lokasiyası sualları (minimum 2/3 düzgün cavab)
- **Email Doğrulama**: Yalnız @bsu.edu.az domeni ilə qeydiyyat
- **Telefon Formatı**: +994XXXXXXXXX formatında nömrə tələbi
- **Əngəlləmə Sistemi**: İstənməyən istifadəçiləri əngəlləmə
- **Şikayət Sistemi**: Pozucu istifadəçiləri şikayət etmə
- **Real-time Updates**: Socket.IO ilə ani mesaj çatdırılması
- **Auto-scroll Optimizasiyası**: Yeni mesajlar avtomatik görünür
- **Mesaj Filtri**: Admin tərəfindən qadağan edilmiş sözlərin avtomatik ulduzlanması

### Admin Paneli
- **İstifadəçi İdarəetməsi**: Bütün istifadəçilərin siyahısı, aktiv/deaktiv etmə
- **Təhlükəli Hesablar**: 8+ şikayəti olan hesablar
- **Günün Mövzusu**: Bütün otaqlarda göstərilən mövzu
- **Qaydalar**: İstifadəçilərə göstərilən qaydalar
- **Haqqında**: Layihə haqqında məlumat
- **Filtr Sözləri**: Mesajlarda ulduzlanacaq sözlər
- **Mesaj Silmə Vaxtı**: Qrup və şəxsi mesajlar üçün ayrı-ayrı avtomatik silmə vaxtı
- **Alt Admin Sistemi**: Super admin tərəfindən alt adminlər yaratma

### Təhlükəsizlik
- **Şifrə Hashing**: bcrypt ilə şifrələrin təhlükəsiz saxlanması
- **Session Idarəetməsi**: Express session ilə təhlükəsiz giriş
- **Deaktiv Hesablar**: Deaktiv edilmiş hesablarla giriş qadağası
- **Bloklanmış Email/Telefon**: Deaktiv hesabların yenidən qeydiyyatının qarşısının alınması

### Texniki Xüsusiyyətlər
- **Real-time Communication**: Socket.IO WebSocket bağlantıları
- **In-memory Messages**: Mesajlar RAM-da saxlanır (sürətli və avtomatik silinmə)
- **PostgreSQL Database**: İstifadəçi məlumatları və parametrlər
- **Baku Timezone**: Bütün tarixlər Bakı saatına görə
- **Auto-delete Messages**: Admin tərəfindən müəyyən edilmiş vaxtdan sonra avtomatik silinmə
- **Responsive Design**: Mobil və desktop uyğun dizayn

## 🚀 URLs

### Development (Sandbox)
- **Frontend**: https://3000-iuap7mjbz5d7mh1cxzc6u-ad490db5.sandbox.novita.ai/
- **Admin Panel**: https://3000-iuap7mjbz5d7mh1cxzc6u-ad490db5.sandbox.novita.ai/admin-login.html
- **GitHub**: https://github.com/sevilsfrova213-netizen/bdu

### Production (Render.com)
Deploy etdikdən sonra buraya əlavə olunacaq

- **Backend**: Node.js, Express.js
- **Real-time**: Socket.IO
- **Database**: PostgreSQL (Render)
- **Authentication**: bcrypt, express-session
- **Frontend**: Vanilla JavaScript, CSS3, HTML5

## 📁 Layihə Strukturu

```
webapp/
├── server.js              # Əsas server faylı
├── database.sql           # Database schema
├── package.json           # Dependencies
├── .env                   # Environment variables
├── public/
│   ├── index.html         # Login səhifəsi
│   ├── register.html      # Qeydiyyat səhifəsi
│   ├── chat.html          # Chat interface
│   ├── admin.html         # Admin paneli
│   ├── css/
│   │   ├── style.css      # Login/Register styles
│   │   ├── chat.css       # Chat interface styles
│   │   └── admin.css      # Admin panel styles
│   ├── js/
│   │   ├── login.js       # Login logic
│   │   ├── register.js    # Registration logic
│   │   ├── chat.js        # Chat functionality
│   │   └── admin.js       # Admin panel logic
│   └── images/
│       └── avatar-*.png   # Avatar şəkilləri (27 ədəd)
```

## 🚀 Quraşdırma və İstifadə

### 1. Dependencies Quraşdırma
```bash
npm install
```

### 2. Environment Variables
`.env` faylında aşağıdakı parametrlər:
```
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret-key
NODE_ENV=production
```

### 3. Database Yaratma
```bash
# PostgreSQL-də database.sql faylını icra edin
psql -U username -d database_name -f database.sql
```

### 4. Development
```bash
npm run dev
```

### 5. Production (Render.com)
```bash
npm start
```

## 👤 Admin Girişi

### Super Admin
- **Username**: 618ursamajor618
- **Password**: majorursa618

## 📊 Database Schema

### Tables
- **users**: İstifadəçi məlumatları
- **messages**: Mesaj arxivi (əsasən in-memory)
- **blocked_users**: Əngəllənmiş istifadəçilər
- **reports**: Şikayətlər
- **admin_users**: Admin hesabları
- **settings**: Sistem parametrləri

## 🎯 Fakültələr

1. Mexanika-riyaziyyat fakültəsi
2. Tətbiqi riyaziyyat və kibernetika fakültəsi
3. Fizika fakültəsi
4. Kimya fakültəsi
5. Biologiya fakültəsi
6. Ekologiya və torpaqşünaslıq fakültəsi
7. Coğrafiya fakültəsi
8. Geologiya fakültəsi
9. Filologiya fakültəsi
10. Tarix fakültəsi
11. Beynəlxalq münasibətlər və iqtisadiyyat fakültəsi
12. Hüquq fakültəsi
13. Jurnalistika fakültəsi
14. İnformasiya və sənəd menecmenti fakültəsi
15. Şərqşünaslıq fakültəsi
16. Sosial elmlər və psixologiya fakültəsi

## 🔐 Doğrulama Sualları

Qeydiyyat zamanı fakültələrin korpus lokasiyalarını yoxlayan suallar:
- **Korpus 1**: Filologiya, Beynəlxalq münasibətlər və iqtisadiyyat, Hüquq
- **Korpus 2**: Jurnalistika, İnformasiya və sənəd menecmenti, Şərqşünaslıq, Sosial elmlər və psixologiya
- **Korpus 3**: Mexanika-riyaziyyat, Tətbiqi riyaziyyat və kibernetika, Tarix
- **Əsas korpus**: Fizika, Kimya, Biologiya, Ekologiya və torpaqşünaslıq, Coğrafiya, Geologiya

## 📱 Deployment

### Render.com
1. GitHub repository-ni Render-ə bağlayın
2. Web Service kimi yaradın
3. Environment variables əlavə edin
4. Deploy edin

### Database (Render PostgreSQL)
- **Host**: dpg-d63jqvcr85hc73b9bvdg-a.oregon-postgres.render.com
- **Database**: bdsu
- **User**: bdsu_user

## 🎨 Dizayn

- **Əsas Rəng**: Pink-Purple gradient (#e94d88 → #b857c5 → #8a4fb8)
- **Mesaj Bubbles**: Yumru künclər, kölgə effektləri
- **Avatar**: Dairəvi profil şəkilləri
- **Responsive**: Mobil və desktop uyğun

## ⚙️ Optimallaşdırma

- **Mesajlar RAM-da**: Sürətli əməliyyatlar, avtomatik təmizlənmə
- **Auto-scroll**: Yeni mesajlar avtomatik görünür
- **Blocked Cache**: Əngəllənmiş istifadəçilər client-side cache-də
- **Socket.IO Rooms**: Fakültə otaqları ayrı-ayrı namespace-lər

## 📝 Lisenziya

Bu layihə BSU Chat üçün hazırlanmışdır.

## 🛠️ Completed Features

✅ 16 fakültə otağı
✅ Qeydiyyat və doğrulama
✅ Şəxsi mesajlaşma
✅ Əngəlləmə sistemi
✅ Şikayət sistemi
✅ Admin paneli
✅ Mesaj filtri
✅ Auto-delete mesajlar
✅ Real-time updates
✅ Responsive dizayn
✅ Avatar sistemi (27 ədəd)

## 🚀 Recommended Next Steps

1. Email doğrulama sistemi (SMTP)
2. Mesaj bildirişləri (push notifications)
3. Fayl paylaşımı (şəkil, sənəd)
4. Mesaj axtarışı
5. User profil səhifəsi
6. Mesaj edit/delete funksiyası
7. Typing indicator
8. Online/offline status
9. Message reactions
10. Voice messages

---

**Developer**: AI Assistant  
**Date**: February 2024  
**Version**: 1.0.0
