# 🎨 Animation Builder - LibraDigital
### Superadmin Feature · GSAP · Drag & Drop · Gen Z Vibes

> Admin bikin animasi sekali → user tinggal pilih dari dropdown → undangan langsung hidup.  
> Tidak ada coding di sisi user. Tidak ada iframe. Tidak ada halaman baru.

---

## 📋 Table of Contents

1. [Big Picture - Gimana Ini Kerja](#1-big-picture--gimana-ini-kerja)
2. [Siapa yang Ngapain](#2-siapa-yang-ngapain)
3. [Animation Pack vs Animation Asset](#3-animation-pack-vs-animation-asset)
4. [9 Motion Presets](#4-9-motion-presets)
5. [Builder UI - Superadmin](#5-builder-ui--superadmin)
6. [Alur Kerja Admin Step by Step](#6-alur-kerja-admin-step-by-step)
7. [User Experience - Stepper Step 6](#7-user-experience--stepper-step-6)
8. [Preview Modal - Detail](#8-preview-modal--detail)
9. [AnimationLayer - Cara Render di Invitation](#9-animationlayer--cara-render-di-invitation)
10. [Database Schema](#10-database-schema)
11. [File Structure](#11-file-structure)
12. [Backend - Routes & Controller](#12-backend--routes--controller)
13. [Frontend - Kode Lengkap](#13-frontend--kode-lengkap)
14. [R2 Storage](#14-r2-storage)
15. [Seeder - Pack Bawaan](#15-seeder--pack-bawaan)
16. [Rules & Constraints](#16-rules--constraints)
17. [FAQ](#17-faq)

---

## 1. Big Picture - Gimana Ini Kerja

```
                         ╔══════════════════════════════════╗
                         ║      SUPERADMIN BUILDER          ║
                         ║                                  ║
                         ║  Upload PNG transparan           ║
                         ║       ↓                          ║
                         ║  Drag ke canvas section          ║
                         ║       ↓                          ║
                         ║  Pilih motion preset             ║
                         ║       ↓                          ║
                         ║  Atur timing + opacity + size    ║
                         ║       ↓                          ║
                         ║  Simpan sebagai "Animation Pack" ║
                         ╚══════════════╦═══════════════════╝
                                        ║
                              disimpan ke DB + R2
                                        ║
                         ╔══════════════╩═══════════════════╗
                         ║        USER - STEP 6             ║
                         ║                                  ║
                         ║  Pilih template tema             ║
                         ║       ↓                          ║
                         ║  Dropdown "Animation Pack"       ║
                         ║  → list nama yang admin buat     ║
                         ║       ↓                          ║
                         ║  Klik 👁 Preview                 ║
                         ║  → popup modal animasi live      ║
                         ║       ↓                          ║
                         ║  Klik "Pakai" → disimpan         ║
                         ╚══════════════╦═══════════════════╝
                                        ║
                         ╔══════════════╩═══════════════════╗
                         ║     INVITATION PAGE (PUBLIC)     ║
                         ║                                  ║
                         ║  AnimationLayer render di atas   ║
                         ║  setiap section undangan         ║
                         ║  pointer-events: none            ║
                         ║  animasi infinite loop           ║
                         ╚══════════════════════════════════╝
```

**Satu kalimat:** Admin desain animasinya, user tinggal pilih namanya, tamu undangan yang ngerasain hasilnya.

---

## 2. Siapa yang Ngapain

| Aktor | Akses | Tanggung Jawab |
|---|---|---|
| **Superadmin** | `/superadmin/animation-packs` | Buat, edit, hapus animation pack. Upload asset. Set tier & section. |
| **User** | Stepper Step 6 | Pilih nama pack dari dropdown. Preview via modal. Klik "Pakai". |
| **Tamu undangan** | URL undangan publik | Lihat hasil animasi berjalan - tidak tahu ada "pack" di baliknya. |

---

## 3. Animation Pack vs Animation Asset

Penting dipahami dulu sebelum masuk implementasi:

```
Animation Pack  "Pink Cherry Blossom"
│
│  ← Satu pack = satu tema visual + satu section target
│  ← Punya nama, slug, thumbnail, tier availability
│
├── Animation Asset  bunga-pink-large.png
│     motion: fall-down · duration: 4000ms · position: 15%, 0% · size: 12%
│
├── Animation Asset  bunga-pink-small.png
│     motion: fall-down · duration: 3000ms · delay: 800ms · position: 45%, 0% · size: 8%
│
├── Animation Asset  petal-scatter.png
│     motion: drift · duration: 5000ms · delay: 1500ms · position: 75%, 0% · size: 6%
│
└── Animation Asset  sparkle-white.png
      motion: twinkle · duration: 1500ms · delay: 200ms · position: 30%, 20% · size: 4%
```

- **1 pack** bisa punya banyak asset (rekomendasi maks 8–10 agar performa tetap smooth)
- **1 pack** hanya untuk **1 section** - kalau mau animasi di hero DAN gallery, buat 2 pack berbeda lalu user pilih keduanya
- Asset PNG/WebP harus **tanpa background** (transparan) - ini yang bikin efeknya natural

---

## 4. Nine Motion Presets

Semua animasi pakai GSAP. Tidak ada CSS keyframes custom - semua terpusat di `motions.ts`.

### 4.1 Catalog Lengkap

| Motion | Efek | Cocok Untuk | Feel |
|---|---|---|---|
| `float-y` | Naik turun pelan, yoyo | Bunga melayang, ornamen mengambang | ☁️ Dreamy |
| `float-x` | Kiri kanan pelan, yoyo | Daun terbawa angin, pita | 🌿 Gentle |
| `fall-down` | Jatuh dari atas ke bawah, infinite | Kelopak bunga, salju, konfeti | 🌸 Romantic |
| `fall-up` | Naik dari bawah, infinite | Gelembung, sparkle naik | ✨ Magical |
| `sway` | Bergoyang seperti tanaman | Ornamen gantung, bunga bambu | 🎋 Organic |
| `breathe` | Scale in/out pelan (pulse) | Logo, ornamen tengah, love heart | 💗 Alive |
| `spin` | Rotate terus 360° | Mandala, snowflake, geometric | 🌀 Hypnotic |
| `spin-slow` | Rotate sangat lambat | Background ornamen besar | 🔄 Subtle |
| `drift` | Melayang + rotate acak pelan | Kelopak bertebaran, glitter | 🍂 Natural |
| `twinkle` | Opacity flicker (kedip-kedip) | Bintang, glitter, cahaya | ⭐ Sparkling |

### 4.2 Kombinasi yang Bagus

```
"Pink Cherry Blossom" (hero)
  bunga besar   → fall-down (4000ms)
  bunga kecil   → fall-down (3000ms, delay 800ms)
  petal kecil   → drift (5000ms)
  sparkle putih → twinkle (1500ms)

"Gold Glitter Rain" (hero)
  glitter besar  → fall-down (3500ms, opacity 0.7)
  glitter kecil  → fall-down (2500ms, delay 500ms, opacity 0.5)
  bokeh bulat    → breathe (2000ms, opacity 0.3)
  star sparkle   → twinkle (1000ms)

"Batik Float" (story)
  motif batik 1  → float-y (6000ms, opacity 0.15)
  motif batik 2  → float-x (7000ms, delay 1000ms, opacity 0.12)
  ornamen sudut  → spin-slow (15000ms, opacity 0.1)

"Firefly Twinkle" (footer)
  firefly besar  → twinkle (800ms) + float-y (4000ms)
  firefly kecil  → twinkle (600ms, delay 300ms) + drift (5000ms)
  bokeh hijau    → breathe (3000ms, opacity 0.2)
```

---

## 5. Builder UI - Superadmin

### 5.1 Layout Keseluruhan

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  🎨 Animation Builder                      [▶ Preview Full]  [💾 Simpan Pack] │
├────────────────────┬───────────────────────────────────┬─────────────────────┤
│                    │                                   │                     │
│   ASSET LIBRARY    │           CANVAS                  │    PROPERTIES       │
│   ──────────────   │           ──────                  │    ──────────────   │
│                    │                                   │                     │
│   [↑ Upload PNG]   │  Section: [Hero  ▼]               │  (klik asset dulu)  │
│                    │                                   │                     │
│   🖼 bunga-1.png   │  ┌─────────────────────────────┐  │                     │
│   🖼 bunga-2.png   │  │                             │  │                     │
│   🖼 petal.png     │  │   🌸           ✨            │  │                     │
│   🖼 glitter.png   │  │        🌸                   │  │                     │
│   🖼 sparkle.png   │  │  ✨                  🌸      │  │                     │
│   🖼 star.png      │  │                             │  │                     │
│   🖼 ornamen.png   │  │  The Wedding of             │  │                     │
│   🖼 batik-1.png   │  │  Rina & Budi               │  │                     │
│                    │  │  12 Desember 2026           │  │                     │
│   ─────────────    │  │                             │  │                     │
│   8 assets         │  └─────────────────────────────┘  │                     │
│                    │                                   │                     │
│                    │  [▶ Play]  [⏹ Stop]  [🔄 Reset]   │                     │
│                    │                                   │                     │
├────────────────────┴───────────────────────────────────┴─────────────────────┤
│  Nama Pack: [Pink Cherry Blossom              ]  Section: [Hero ▼]            │
│  Tier:      [✓ Standard]  [✓ Premium]  [✓ Signature]  [ ] Starter            │
│  Status:    [✓ Aktif]                                                         │
│                                                              [💾 Simpan Pack] │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Properties Panel (saat 1 asset dipilih)

```
┌─────────────────────┐
│  PROPERTIES         │
│  ──────────────     │
│                     │
│  Asset:             │
│  bunga-pink.png     │
│  [🗑 Hapus]         │
│                     │
│  Motion Type:       │
│  ┌───────────────┐  │
│  │ fall-down  ▼  │  │
│  └───────────────┘  │
│                     │
│  Duration           │
│  3000 ms            │
│  ├────────────┤     │
│  500ms    8000ms    │
│                     │
│  Delay              │
│  0 ms               │
│  ├────────────┤     │
│  0ms      3000ms    │
│                     │
│  Opacity            │
│  0.85               │
│  ├────────────┤     │
│  0.1       1.0      │
│                     │
│  Size               │
│  12 %               │
│  ├────────────┤     │
│  3%         50%     │
│                     │
│  Z-index            │
│  [ 10 ]             │
│                     │
│  Position           │
│  X: 23.5%  Y: 0.0%  │
│  (drag di canvas)   │
└─────────────────────┘
```

### 5.3 Interaksi Detail

| Aksi | Cara | Hasil |
|---|---|---|
| Tambah asset ke canvas | Drag dari library ke canvas | Asset muncul di posisi drop |
| Pindah asset | Drag asset di dalam canvas | `position_x` dan `position_y` update real-time dalam % |
| Pilih asset | Klik asset di canvas | Border biru muncul, Properties panel aktif |
| Play animasi | Klik tombol ▶ Play | Semua GSAP tween jalan sesuai config masing-masing asset |
| Stop animasi | Klik ⏹ Stop | Semua tween di-kill, asset kembali ke posisi awal |
| Reset posisi | Klik 🔄 Reset | Semua asset kembali ke posisi tersimpan terakhir |
| Ganti section | Dropdown "Section" | Canvas background ganti simulasi (hero = gelap romantis, gallery = terang, dll.) |
| Hapus asset | Klik 🗑 di Properties | Asset hilang dari canvas |
| Simpan pack | Klik 💾 Simpan Pack | `html2canvas` capture canvas → upload thumbnail ke R2 → POST ke backend |

---

## 6. Alur Kerja Admin Step by Step

```
1. BUKA BUILDER
   Superadmin → sidebar "Animation Packs" → klik "+ Buat Pack Baru"
   URL: /superadmin/animation-packs/create

2. UPLOAD ASSET
   Klik "↑ Upload PNG" di panel library
   → pilih file PNG/WebP transparan dari komputer
   → file di-upload ke R2: animation-assets/{temp-uuid}/filename.png
   → thumbnail muncul di library panel
   (Bisa upload banyak sekaligus)

3. BUILD ANIMASI
   → Drag asset dari library ke canvas
   → Klik asset → Properties panel aktif
   → Pilih motion type dari dropdown
   → Atur slider: duration, delay, opacity, size
   → Drag ulang posisi di canvas kalau perlu
   → Ulangi untuk semua asset

4. PREVIEW
   → Klik "▶ Play" untuk lihat animasi berjalan
   → Kalau kurang sreg, adjust slider, Play lagi
   → Klik "▶ Preview Full" untuk lihat di mock invitation full-screen

5. SIMPAN
   → Isi "Nama Pack" (cth: "Pink Cherry Blossom")
   → Pilih Section target (Hero / Gallery / Story / dll.)
   → Centang tier yang boleh pakai (Standard / Premium / Signature)
   → Klik "💾 Simpan Pack"
   → html2canvas capture → thumbnail ter-generate otomatis
   → Data tersimpan ke DB, asset dipindah ke path permanent di R2
   → Redirect ke list dengan notif sukses

6. PACK LANGSUNG AKTIF
   → Dalam hitungan detik, pack muncul di dropdown user stepper
   → Tidak perlu deploy ulang
```

---

## 7. User Experience - Stepper Step 6

Dalam Step 6 (pilih template), setelah memilih tema visual, user melihat section tambahan:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ✨  Tambahkan Animasi  (Opsional)                                  │
│                                                                     │
│  Buat undangan kamu makin hidup dengan animasi floating elements   │
│                                                                     │
│  ┌──────────────────────────────────────────┐  ┌────────────────┐  │
│  │  🌸  Pink Cherry Blossom             ▼  │  │  👁  Preview   │  │
│  └──────────────────────────────────────────┘  └────────────────┘  │
│                                                                     │
│  ✓ Tersedia di paket kamu (Standard)          [ Tanpa Animasi ]    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Dropdown berisi:**
- `Tanpa Animasi` (default, selalu tersedia)
- Semua pack aktif yang `available_for` includes paket user

**Tombol "👁 Preview"** hanya aktif kalau sudah pilih pack (bukan "Tanpa Animasi").

---

## 8. Preview Modal - Detail

### 8.1 Wireframe Modal

```
┌────── overlay backdrop blur ──────────────────────────────────────┐
│                                                                    │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │  ✨ Pink Cherry Blossom                             [✕]  │    │
│   ├──────────────────────────────────────────────────────────┤    │
│   │                                                          │    │
│   │   🌸        ✨          🌸                              │    │
│   │         🌸                     🌸                       │    │
│   │   ✨                                   🌸               │    │
│   │                                                          │    │
│   │              The Wedding of                              │    │
│   │           Rina & Budi ✨                                 │    │
│   │           12 Desember 2026                               │    │
│   │                                                          │    │
│   │   🌸    ✨          🌸          ✨      🌸              │    │
│   │                                                          │    │
│   │   [animasi jalan terus selama modal terbuka]             │    │
│   │                                                          │    │
│   ├──────────────────────────────────────────────────────────┤    │
│   │  📱 Preview simulasi tampilan di HP tamu                 │    │
│   ├──────────────────────────────────────────────────────────┤    │
│   │      [  Batal  ]          [ ✓ Pakai Animation Ini ]      │    │
│   └──────────────────────────────────────────────────────────┘    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### 8.2 Behaviour Modal

```
User klik 👁 Preview
  ↓
Modal mount ke DOM
  ↓
useGSAP() hook jalan
  → loop semua assets di pack
  → jalankan MOTION_PRESETS[asset.motion_type](el, asset)
  → animasi infinite loop langsung dimulai
  ↓
User lihat animasi live pakai nama & tanggal mereka sendiri
  ↓
Option A: Klik "Pakai Animation Ini"
  → onConfirm(pack.slug) dipanggil
  → stepperStore.setAnimationPack(pack.slug) di Zustand
  → modal unmount → semua GSAP tween di-kill otomatis (useGSAP cleanup)
  ↓
Option B: Klik "Batal" atau tekan Escape
  → modal unmount, state tidak berubah
  → pack yang dipilih sebelumnya tetap aktif
```

### 8.3 Data yang Tampil di Preview

Data diambil langsung dari Zustand `stepperStore` - **bukan data dummy**:

| Field | Sumber |
|---|---|
| Nama pengantin | `stepperStore.data.bride_name` + `groom_name` |
| Tanggal | `stepperStore.data.wedding_date` |
| Foto cover | `stepperStore.data.cover_photo_key` → signed URL |

Kalau user belum isi nama (masih draft), tampil placeholder: `"Nama Pengantin"` dan `"00 Bulan 0000"`.

---

## 9. AnimationLayer - Cara Render di Invitation

### 9.1 Konsep

`AnimationLayer` adalah komponen transparan yang di-render **di atas** section invitation. Ia tidak mengubah layout section apapun - hanya float di atasnya.

```
┌─────────────────────────────────────┐
│         HeroSection                 │  ← section asli (z-index normal)
│                                     │
│   The Wedding of Rina & Budi        │
│   12 Desember 2026                  │
│                                     │
├─────────────────────────────────────┤  ← position: absolute, inset-0
│         AnimationLayer              │  ← z-index: 10, pointer-events: none
│                                     │
│   🌸        ✨          🌸          │  ← asset PNG melayang-layang
│         🌸                  🌸      │
│   ✨                   🌸           │
│                                     │
└─────────────────────────────────────┘
```

`pointer-events: none` → tamu tetap bisa scroll, klik tombol, isi RSVP. Animasi tidak menghalangi apapun.

### 9.2 Cara Pakai di Section

```tsx
// Di setiap section yang support animasi:
<div className="relative">
  <HeroSection data={invitation} />
  <AnimationLayer
    packSlug={invitation.animation_pack_slug}
    section="hero"
  />
</div>

// Kalau invitation.animation_pack_slug null → AnimationLayer return null
// Tidak ada error, tidak ada loading state tersendiri
```

### 9.3 Performance Considerations

- Maksimal **8–10 asset per pack** - lebih dari itu bisa lag di HP mid-range
- `fall-down` dengan banyak asset → pakai `stagger` GSAP bukan loop terpisah
- Semua tween di-kill saat component unmount (useGSAP cleanup otomatis)
- Asset di-preload saat modal preview buka - tidak ada flicker
- PNG transparan maksimal **200KB per asset** (enforced di upload validation)

---

## 10. Database Schema

### Tabel `animation_packs`

```sql
CREATE TABLE animation_packs (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(100) NOT NULL UNIQUE,
    section         ENUM('hero','gallery','story','event','footer','full_page') NOT NULL,
    thumbnail_url   VARCHAR(500) NULL,         -- auto-generated via html2canvas
    available_for   JSON NOT NULL,             -- ["standard","premium","signature"]
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order      INT NOT NULL DEFAULT 0,
    created_by      BIGINT UNSIGNED NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_section (section),
    INDEX idx_active (is_active)
);
```

### Tabel `animation_assets`

```sql
CREATE TABLE animation_assets (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    pack_id         BIGINT UNSIGNED NOT NULL,
    asset_key       VARCHAR(500) NOT NULL,     -- R2 object key
    asset_url       VARCHAR(500) NOT NULL,     -- public CDN URL
    motion_type     ENUM(
                        'float-y', 'float-x',
                        'fall-down', 'fall-up',
                        'sway', 'breathe',
                        'spin', 'spin-slow',
                        'drift', 'twinkle'
                    ) NOT NULL DEFAULT 'float-y',
    position_x      DECIMAL(5,2) NOT NULL DEFAULT 50.00,  -- % lebar section
    position_y      DECIMAL(5,2) NOT NULL DEFAULT 50.00,  -- % tinggi section
    width_percent   DECIMAL(5,2) NOT NULL DEFAULT 10.00,  -- % lebar section
    opacity         DECIMAL(3,2) NOT NULL DEFAULT 1.00,   -- 0.00–1.00
    duration_ms     INT NOT NULL DEFAULT 3000,             -- ms per siklus
    delay_ms        INT NOT NULL DEFAULT 0,                -- ms delay awal
    repeat_count    INT NOT NULL DEFAULT -1,               -- -1 = infinite
    z_index         INT NOT NULL DEFAULT 10,
    sort_order      INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (pack_id) REFERENCES animation_packs(id) ON DELETE CASCADE,
    INDEX idx_pack (pack_id)
);
```

### Relasi ke `invitations`

```sql
-- Kolom yang ditambahkan ke tabel invitations
ALTER TABLE invitations
    ADD COLUMN animation_pack_slug VARCHAR(100) NULL
        REFERENCES animation_packs(slug) ON UPDATE CASCADE ON DELETE SET NULL;
```

> Pakai slug (bukan FK integer) supaya kalau pack diedit namanya, slug tetap sama dan tidak ada orphaned reference.

---

## 11. File Structure

```
resources/js/
├── admin/
│   └── animation-builder/
│       ├── motions.ts                    ← 9 preset GSAP (source of truth)
│       ├── types.ts                      ← AnimationPack, AnimationAsset, AssetConfig
│       ├── utils.ts                      ← positionToPercent, clampValue, generateSlug
│       └── thumbnailCapture.ts           ← html2canvas wrapper
│
├── Pages/
│   ├── Admin/
│   │   └── AnimationPacks/
│   │       ├── Index.tsx                 ← list semua pack (table + actions)
│   │       ├── Create.tsx                ← builder UI (main page)
│   │       └── Edit.tsx                 ← sama dengan Create, pre-filled data
│   │
│   └── Stepper/
│       ├── Step6Template.tsx             ← include AnimationPicker component
│       └── components/
│           ├── AnimationPicker.tsx       ← dropdown + tombol preview
│           └── AnimationPreviewModal.tsx ← modal preview live
│
└── Components/
    └── Invitation/
        └── AnimationLayer.tsx            ← render di halaman publik undangan

app/
├── Models/
│   ├── AnimationPack.php
│   └── AnimationAsset.php
│
├── Http/Controllers/Admin/
│   ├── AnimationPackController.php
│   └── AnimationAssetController.php      ← hanya presign endpoint
│
└── Http/Requests/
    └── StoreAnimationPackRequest.php

database/
├── migrations/
│   ├── xxxx_create_animation_packs_table.php
│   └── xxxx_create_animation_assets_table.php
└── seeders/
    └── AnimationPackSeeder.php
```

---

## 12. Backend - Routes & Controller

### Routes

```php
// routes/web.php

// Superadmin - Animation Packs (protected)
Route::prefix('superadmin/animation-packs')
    ->middleware(['auth', 'verified', 'role:superadmin'])
    ->name('superadmin.animation-packs.')
    ->group(function () {
        Route::get('/',          [AnimationPackController::class, 'index'])->name('index');
        Route::get('/create',    [AnimationPackController::class, 'create'])->name('create');
        Route::post('/',         [AnimationPackController::class, 'store'])->name('store');
        Route::get('/{pack}',    [AnimationPackController::class, 'edit'])->name('edit');
        Route::put('/{pack}',    [AnimationPackController::class, 'update'])->name('update');
        Route::delete('/{pack}', [AnimationPackController::class, 'destroy'])->name('destroy');
    });

// Superadmin - Asset Upload Presign
Route::post('/superadmin/animation-assets/presign',
    [AnimationAssetController::class, 'presign'])
    ->middleware(['auth', 'verified', 'role:superadmin'])
    ->name('superadmin.animation-assets.presign');

// routes/api.php - Public JSON (tidak butuh auth, untuk dropdown stepper)
Route::get('/animation-packs', [AnimationPackController::class, 'publicIndex'])
    ->name('api.animation-packs');
```

### Model

```php
// app/Models/AnimationPack.php

class AnimationPack extends Model
{
    protected $fillable = [
        'name', 'slug', 'section', 'thumbnail_url',
        'available_for', 'is_active', 'sort_order', 'created_by',
    ];

    protected $casts = [
        'available_for' => 'array',
        'is_active'     => 'boolean',
    ];

    public function assets(): HasMany
    {
        return $this->hasMany(AnimationAsset::class, 'pack_id')->orderBy('sort_order');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Scope: hanya pack yang tersedia untuk tier tertentu
    public function scopeAvailableFor(Builder $query, string $tier): Builder
    {
        return $query->where('is_active', true)
                     ->whereJsonContains('available_for', $tier);
    }
}
```

### Controller

```php
// app/Http/Controllers/Admin/AnimationPackController.php

class AnimationPackController extends Controller
{
    // List untuk superadmin
    public function index(): Response
    {
        $packs = AnimationPack::with('assets')
            ->withCount('assets')
            ->latest()
            ->paginate(20);

        return Inertia::render('Admin/AnimationPacks/Index', compact('packs'));
    }

    // Buka builder UI
    public function create(): Response
    {
        return Inertia::render('Admin/AnimationPacks/Create');
    }

    // Simpan pack baru
    public function store(StoreAnimationPackRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $pack = AnimationPack::create([
                'name'          => $request->name,
                'slug'          => Str::slug($request->name),
                'section'       => $request->section,
                'thumbnail_url' => $request->thumbnail_url,
                'available_for' => $request->available_for,
                'is_active'     => $request->is_active ?? true,
                'created_by'    => auth()->id(),
            ]);

            foreach ($request->validated('assets') as $index => $assetData) {
                $pack->assets()->create([...$assetData, 'sort_order' => $index]);
            }
        });

        return redirect()
            ->route('superadmin.animation-packs.index')
            ->with('success', 'Animation pack berhasil disimpan! 🎉');
    }

    // Public JSON - untuk dropdown stepper user
    public function publicIndex(Request $request): JsonResponse
    {
        $tier = $request->query('tier', 'standard');

        $packs = AnimationPack::with('assets')
            ->availableFor($tier)
            ->orderBy('sort_order')
            ->get(['id', 'name', 'slug', 'section', 'thumbnail_url']);

        return response()->json($packs);
    }
}
```

### Presign Upload

```php
// app/Http/Controllers/Admin/AnimationAssetController.php

public function presign(Request $request): JsonResponse
{
    $request->validate([
        'filename' => ['required', 'string', 'max:255'],
        'mime'     => ['required', 'in:image/png,image/webp'],
        'size'     => ['required', 'integer', 'max:204800'], // max 200KB
    ]);

    $ext = $request->mime === 'image/png' ? 'png' : 'webp';
    $key = 'animation-assets/temp/' . Str::uuid() . '.' . $ext;

    $presignedUrl = Storage::disk('r2')->temporaryUrl(
        $key,
        now()->addMinutes(10),
        ['ContentType' => $request->mime]
    );

    return response()->json([
        'upload_url' => $presignedUrl,
        'key'        => $key,
        'public_url' => config('filesystems.disks.r2.public_url') . '/' . $key,
    ]);
}
```

---

## 13. Frontend - Kode Lengkap

### 13.1 Types

```typescript
// resources/js/admin/animation-builder/types.ts

export type MotionType =
  | 'float-y' | 'float-x'
  | 'fall-down' | 'fall-up'
  | 'sway' | 'breathe'
  | 'spin' | 'spin-slow'
  | 'drift' | 'twinkle'

export type SectionType = 'hero' | 'gallery' | 'story' | 'event' | 'footer' | 'full_page'

export interface AssetConfig {
  id: number
  asset_url: string
  asset_key: string
  motion_type: MotionType
  position_x: number    // 0–100 (%)
  position_y: number    // 0–100 (%)
  width_percent: number // 0–100 (%)
  opacity: number       // 0.00–1.00
  duration_ms: number
  delay_ms: number
  repeat_count: number  // -1 = infinite
  z_index: number
  sort_order: number
}

export interface AnimationPack {
  id: number
  name: string
  slug: string
  section: SectionType
  thumbnail_url: string | null
  available_for: string[]
  is_active: boolean
  assets: AssetConfig[]
}
```

### 13.2 Motion Presets

```typescript
// resources/js/admin/animation-builder/motions.ts
import gsap from 'gsap'
import type { AssetConfig, MotionType } from './types'

type MotionFn = (el: Element, cfg: AssetConfig) => gsap.core.Tween | gsap.core.Timeline

export const MOTION_PRESETS: Record<MotionType, MotionFn> = {

  'float-y': (el, cfg) => gsap.to(el, {
    y: -24,
    duration: cfg.duration_ms / 1000,
    repeat: cfg.repeat_count,
    yoyo: true,
    ease: 'sine.inOut',
    delay: cfg.delay_ms / 1000,
  }),

  'float-x': (el, cfg) => gsap.to(el, {
    x: 20,
    duration: cfg.duration_ms / 1000,
    repeat: cfg.repeat_count,
    yoyo: true,
    ease: 'sine.inOut',
    delay: cfg.delay_ms / 1000,
  }),

  'fall-down': (el, cfg) => gsap.fromTo(el,
    { y: -120, opacity: 0, rotate: gsap.utils.random(-20, 20) },
    {
      y: '115vh',
      opacity: cfg.opacity,
      duration: cfg.duration_ms / 1000,
      repeat: cfg.repeat_count,
      ease: 'none',
      delay: cfg.delay_ms / 1000,
    }
  ),

  'fall-up': (el, cfg) => gsap.fromTo(el,
    { y: '115vh', opacity: 0 },
    {
      y: -120,
      opacity: cfg.opacity,
      duration: cfg.duration_ms / 1000,
      repeat: cfg.repeat_count,
      ease: 'power1.in',
      delay: cfg.delay_ms / 1000,
    }
  ),

  'sway': (el, cfg) => gsap.to(el, {
    rotate: 14,
    duration: cfg.duration_ms / 1000,
    repeat: cfg.repeat_count,
    yoyo: true,
    ease: 'sine.inOut',
    transformOrigin: '50% 0%',
    delay: cfg.delay_ms / 1000,
  }),

  'breathe': (el, cfg) => gsap.to(el, {
    scale: 1.18,
    duration: cfg.duration_ms / 1000,
    repeat: cfg.repeat_count,
    yoyo: true,
    ease: 'power1.inOut',
    delay: cfg.delay_ms / 1000,
  }),

  'spin': (el, cfg) => gsap.to(el, {
    rotate: 360,
    duration: cfg.duration_ms / 1000,
    repeat: cfg.repeat_count,
    ease: 'none',
    delay: cfg.delay_ms / 1000,
  }),

  'spin-slow': (el, cfg) => gsap.to(el, {
    rotate: 360,
    duration: cfg.duration_ms / 1000 * 5, // 5x lebih lambat
    repeat: cfg.repeat_count,
    ease: 'none',
    delay: cfg.delay_ms / 1000,
  }),

  'drift': (el, cfg) => {
    const tl = gsap.timeline({ repeat: cfg.repeat_count, delay: cfg.delay_ms / 1000 })
    tl.to(el, {
      x: gsap.utils.random(-30, 30),
      y: gsap.utils.random(-20, 20),
      rotate: gsap.utils.random(-15, 15),
      duration: cfg.duration_ms / 1000,
      ease: 'sine.inOut',
    })
    tl.to(el, {
      x: gsap.utils.random(-30, 30),
      y: gsap.utils.random(-20, 20),
      rotate: gsap.utils.random(-15, 15),
      duration: cfg.duration_ms / 1000,
      ease: 'sine.inOut',
    })
    return tl
  },

  'twinkle': (el, cfg) => gsap.to(el, {
    opacity: 0.05,
    duration: cfg.duration_ms / 1000,
    repeat: cfg.repeat_count,
    yoyo: true,
    ease: 'power2.inOut',
    delay: cfg.delay_ms / 1000,
  }),
}

// Helper: jalankan semua asset sekaligus
export function playAll(container: HTMLElement, assets: AssetConfig[]): gsap.core.Tween[] {
  return assets.map(asset => {
    const el = container.querySelector(`[data-asset="${asset.id}"]`)
    if (!el) return null
    return MOTION_PRESETS[asset.motion_type]?.(el, asset)
  }).filter(Boolean) as gsap.core.Tween[]
}

// Helper: kill semua tween dalam container
export function killAll(container: HTMLElement): void {
  gsap.killTweensOf(container.querySelectorAll('[data-asset]'))
}
```

### 13.3 AnimationLayer Component

```typescript
// resources/js/Components/Invitation/AnimationLayer.tsx
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { playAll } from '@/admin/animation-builder/motions'
import type { AnimationPack } from '@/admin/animation-builder/types'

interface Props {
  pack: AnimationPack | null
  section: string
}

export function AnimationLayer({ pack, section }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  const sectionAssets = pack?.assets.filter(a => a.section === section) ?? []

  useGSAP(() => {
    if (!containerRef.current || sectionAssets.length === 0) return
    playAll(containerRef.current, sectionAssets)
    // cleanup otomatis saat unmount via useGSAP
  }, { scope: containerRef, dependencies: [pack?.slug, section] })

  if (!pack || sectionAssets.length === 0) return null

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {sectionAssets.map(asset => (
        <img
          key={asset.id}
          data-asset={asset.id}
          src={asset.asset_url}
          alt=""
          draggable={false}
          className="absolute select-none will-change-transform"
          style={{
            left:    `${asset.position_x}%`,
            top:     `${asset.position_y}%`,
            width:   `${asset.width_percent}%`,
            opacity: asset.opacity,
            zIndex:  asset.z_index,
          }}
        />
      ))}
    </div>
  )
}
```

### 13.4 AnimationPreviewModal

```typescript
// resources/js/Pages/Stepper/components/AnimationPreviewModal.tsx
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { playAll } from '@/admin/animation-builder/motions'
import type { AnimationPack } from '@/admin/animation-builder/types'

interface StepperSnapshot {
  bride_name: string
  groom_name: string
  wedding_date: string
  cover_photo_url?: string
}

interface Props {
  pack: AnimationPack
  stepperData: StepperSnapshot
  onConfirm: (packSlug: string) => void
  onClose: () => void
}

export function AnimationPreviewModal({ pack, stepperData, onConfirm, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  const brideName  = stepperData.bride_name  || 'Nama Pengantin'
  const groomName  = stepperData.groom_name  || 'Nama Pengantin'
  const date       = stepperData.wedding_date || '00 Bulan 0000'

  useGSAP(() => {
    if (!containerRef.current) return
    playAll(containerRef.current, pack.assets)
  }, { scope: containerRef })

  // Tutup modal saat klik backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl ring-1 ring-black/5">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <span className="text-base">✨</span>
            <span className="font-semibold text-sm text-stone-800">{pack.name}</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Preview area - simulasi HP portrait */}
        <div
          ref={containerRef}
          className="relative h-72 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #fdf4f7 0%, #fce8ef 50%, #f9dde7 100%)',
          }}
        >
          {/* Asset animasi */}
          {pack.assets.map(asset => (
            <img
              key={asset.id}
              data-asset={asset.id}
              src={asset.asset_url}
              alt=""
              draggable={false}
              className="absolute pointer-events-none select-none will-change-transform"
              style={{
                left:    `${asset.position_x}%`,
                top:     `${asset.position_y}%`,
                width:   `${asset.width_percent}%`,
                opacity: asset.opacity,
                zIndex:  asset.z_index,
              }}
            />
          ))}

          {/* Konten mini undangan */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 text-center px-6">
            <p className="text-[10px] tracking-[0.25em] uppercase text-rose-400 mb-2 font-medium">
              The Wedding of
            </p>
            <h2 className="text-xl font-serif text-stone-800 leading-tight">
              {brideName}
              <br />
              <span className="text-stone-400 text-sm font-sans">&</span>
              <br />
              {groomName}
            </h2>
            <div className="w-8 h-px bg-rose-300 my-2" />
            <p className="text-xs text-stone-500">{date}</p>
          </div>
        </div>

        {/* Info banner */}
        <div className="px-4 py-2 bg-amber-50 border-y border-amber-100 text-center">
          <p className="text-xs text-amber-700">
            📱 Simulasi tampilan di HP tamu · Animasi langsung berjalan
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 p-4">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={() => { onConfirm(pack.slug); onClose() }}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm font-semibold hover:from-rose-600 hover:to-pink-600 transition-all shadow-sm shadow-rose-200"
          >
            ✓ Pakai Animasi Ini
          </button>
        </div>

      </div>
    </div>
  )
}
```

---

## 14. R2 Storage

### Path Structure

```
bucket: libradigital-media
└── animation-assets/
    ├── temp/                             ← saat upload (sebelum pack disimpan)
    │   └── {uuid}.png
    │
    └── {pack-slug}/                      ← setelah pack disimpan (permanent)
        ├── bunga-pink-large.png
        ├── bunga-pink-small.png
        ├── petal-scatter.png
        └── sparkle-white.png
```

### Lifecycle Asset

```
Admin upload PNG
  → presign endpoint generate URL ke animation-assets/temp/{uuid}.png
  → browser PUT langsung ke R2
  → URL sementara tampil di builder canvas

Admin klik "Simpan Pack"
  → backend pindah file: temp/{uuid}.png → {pack-slug}/original-name.png
  → DB record disimpan dengan key permanent
  → temp file dihapus

Pack dihapus admin
  → DB record deleted (CASCADE hapus animation_assets)
  → R2 files dihapus via job DeleteAnimationAssetsJob (database queue)
```

> **Asset animasi tidak punya expiry** - ini milik platform, bukan milik individual user. Berbeda dengan foto undangan yang punya TTL.

---

## 15. Seeder - Pack Bawaan

```php
// database/seeders/AnimationPackSeeder.php

public function run(): void
{
    $packs = [
        [
            'name'          => 'Tanpa Animasi',
            'slug'          => 'none',
            'section'       => 'hero',
            'available_for' => ['starter','standard','premium','signature'],
            'sort_order'    => 0,
        ],
        [
            'name'          => 'Pink Cherry Blossom',
            'slug'          => 'pink-cherry-blossom',
            'section'       => 'hero',
            'available_for' => ['standard','premium','signature'],
            'sort_order'    => 1,
        ],
        [
            'name'          => 'Gold Glitter Rain',
            'slug'          => 'gold-glitter-rain',
            'section'       => 'hero',
            'available_for' => ['premium','signature'],
            'sort_order'    => 2,
        ],
        [
            'name'          => 'White Petal Drift',
            'slug'          => 'white-petal-drift',
            'section'       => 'gallery',
            'available_for' => ['standard','premium','signature'],
            'sort_order'    => 3,
        ],
        [
            'name'          => 'Batik Float',
            'slug'          => 'batik-float',
            'section'       => 'story',
            'available_for' => ['standard','premium','signature'],
            'sort_order'    => 4,
        ],
        [
            'name'          => 'Firefly Twinkle',
            'slug'          => 'firefly-twinkle',
            'section'       => 'footer',
            'available_for' => ['premium','signature'],
            'sort_order'    => 5,
        ],
        [
            'name'          => 'Sakura Storm',
            'slug'          => 'sakura-storm',
            'section'       => 'hero',
            'available_for' => ['signature'],
            'sort_order'    => 6,
        ],
        [
            'name'          => 'Cosmic Sparkle',
            'slug'          => 'cosmic-sparkle',
            'section'       => 'hero',
            'available_for' => ['signature'],
            'sort_order'    => 7,
        ],
        [
            'name'          => 'Moonlit Bokeh',
            'slug'          => 'moonlit-bokeh',
            'section'       => 'event',
            'available_for' => ['premium','signature'],
            'sort_order'    => 8,
        ],
    ];

    foreach ($packs as $pack) {
        AnimationPack::firstOrCreate(['slug' => $pack['slug']], [
            ...$pack,
            'is_active'  => true,
            'created_by' => 1, // superadmin user id
        ]);
    }
}
```

---

## 16. Rules & Constraints

### Upload Rules (dikecek di backend dan frontend)

| Rule | Nilai |
|---|---|
| Format yang diterima | PNG, WebP |
| Harus transparan | Ya - tidak ada validasi otomatis, tapi SOP admin |
| Max file size | 200 KB per asset |
| Max asset per pack | 10 asset |
| Min asset per pack | 1 asset |
| Dimensi | Bebas, tapi rekomendasi min 200×200px |

### Pack Rules

| Rule | Nilai |
|---|---|
| Nama pack | Unik, max 100 karakter |
| Slug | Auto-generate dari nama, immutable setelah disimpan |
| Section per pack | Hanya 1 section (tidak bisa multi-section dalam 1 pack) |
| Pack "Tanpa Animasi" | Tidak bisa dihapus, tidak bisa diedit |

### Tier Rules

| Pack tersedia di | Tier minimum |
|---|---|
| All packs termasuk "Tanpa Animasi" | Starter |
| Pack standar (bunga, petal) | Standard |
| Pack premium (glitter, particle feel) | Premium |
| Pack eksklusif (storm, cosmic, 3D) | Signature |

---

## 17. FAQ

**Q: Kenapa tidak pakai CSS keyframes biasa?**
A: GSAP jauh lebih powerful untuk animasi yang butuh timing kompleks, delay stagger, dan kontrol play/stop. Juga bisa di-kill dengan bersih saat unmount - tidak ada memory leak.

**Q: Kenapa pack hanya untuk 1 section?**
A: Supaya clean di builder. Kalau 1 pack bisa cover semua section, canvas builder jadi kompleks dan positioning jadi ambigu. User tetap bisa pilih pack berbeda untuk section berbeda kalau mau (future feature).

**Q: Apakah animasi memengaruhi performa HP?**
A: Dengan maks 10 asset per pack dan file ≤200KB, tidak. GSAP juga pakai `will-change: transform` dan `requestAnimationFrame` secara internal. Test di Moto G (mid-range Android) sebagai baseline.

**Q: Bagaimana kalau pack yang sedang dipakai user dihapus admin?**
A: `invitation.animation_pack_slug` jadi `NULL` (via `ON DELETE SET NULL`). Undangan tetap tampil normal, hanya tanpa animasi. Tidak ada error.

**Q: Bisakah user membuat animasi sendiri?**
A: Tidak. Animation Builder adalah fitur superadmin only. User hanya memilih nama pack. Ini by design - kalau user bisa custom, support jadi kompleks dan output quality tidak terjamin.

**Q: Thumbnail pack di-generate gimana?**
A: Saat admin klik "Simpan Pack", frontend jalankan `html2canvas` pada canvas builder → hasil capture di-upload ke R2 sebagai `animation-assets/{pack-slug}/thumbnail.png` → URL-nya disimpan di kolom `thumbnail_url`. Thumbnail ini yang tampil di dropdown user dan di list admin.

---

*ANIMATION_BUILDER.md - LibraDigital · Juli 2026*  
*Terhubung dengan: README.md Section 11 (Template & Animation System) dan Section 12 (Animation Builder)*
