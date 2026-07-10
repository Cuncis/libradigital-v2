# 💍 LibraDigital — Wedding Invitation SaaS Platform
### Indonesia Market · Laravel 13 + React 19 (Inertia.js v3) · 2026

> **Tagline:** Buat undangan digital pernikahan dalam 10 menit. Cantik, animated, self-serve.

---

## 📋 Table of Contents

1. [Business Overview](#1-business-overview)
2. [Revenue Model](#2-revenue-model)
3. [Product Architecture](#3-product-architecture)
4. [Tech Stack](#4-tech-stack)
5. [Project Structure](#5-project-structure)
6. [Database Schema](#6-database-schema)
7. [The 7-Step Stepper UI](#7-the-7-step-stepper-ui)
8. [Pricing & Packages](#8-pricing--packages)
9. [Partner & Reseller System](#9-partner--reseller-system)
10. [Payment Integration](#10-payment-integration)
11. [Template & Animation System](#11-template--animation-system)
12. [File Storage Strategy](#12-file-storage-strategy)
13. [Notification System](#13-notification-system)
14. [Roadmap](#14-roadmap)
15. [Getting Started](#15-getting-started)
16. [Environment Variables](#16-environment-variables)
17. [Claude Code Prompts](#17-claude-code-prompts)

---

## 1. Business Overview

**LibraDigital** adalah platform SaaS undangan digital pernikahan untuk pasar Indonesia. Klien membuat undangan mereka sendiri melalui stepper UI 7 langkah tanpa perlu menghubungi admin — fully self-serve.

### Target Market
- Pasangan yang akan menikah di Indonesia (±2 juta pernikahan/tahun)
- Wedding Organizer (WO) yang butuh solusi undangan digital untuk klien mereka
- Fotografer wedding yang ingin menambahkan value ke paket mereka

### Core Differentiator
| Kompetitor (Undangan.id, Paperpaper) | LibraDigital |
|---|---|
| Input data via Google Form + WA | Self-serve stepper 10 menit |
| Template statis CSS dasar | Animasi GSAP, particle effects, WebGL |
| Tidak ada reseller program | Dashboard WO dengan komisi otomatis |
| Template generik | Tema adat daerah (Jawa, Sunda, Minang, Batak) |
| Tidak ada add-on | Upsell add-on saat checkout |

### Revenue Target
```
Bulan 3  : Rp  8–10 juta/bulan   (50 undangan, 5 WO aktif)
Bulan 6  : Rp 25–30 juta/bulan   (150 undangan, 10 WO aktif)
Bulan 12 : Rp 60–80 juta/bulan   (400 undangan, marketplace aktif)
Bulan 24 : Rp 150+ juta/bulan    (white label, Signature tier, API)
```

---

## 2. Revenue Model

### Primary Revenue

**A. One-time per Undangan (B2C)**
Klien bayar sekali, undangan aktif sesuai durasi paket. Margin ~92–93%.

**B. Reseller WO Commission**
WO dapat komisi Rp 20K–75K per undangan. Volume terbesar tanpa ad spend.

**C. Add-on Checkout**
Upsell saat Step 7 (Review & Publish). Rata-rata menambah Rp 30–40K per transaksi.

**D. Perpanjangan Aktif**
Undangan kadaluarsa bisa diperpanjang Rp 49K/6 bulan. Konversi ~40–60%.

### Secondary Revenue (Fase 3+)

**E. Template Marketplace** — Desainer luar jual template, komisi 30–40%.

**F. Affiliate Program** — Konten kreator, mahasiswa, komunitas ibu-ibu.

**G. White Label B2B** — Studio kreatif/EO besar pakai platform dengan branding mereka. Rp 299K–799K/bulan.

**H. API Access** — Developer pihak ketiga integrasi dengan platform. Rp 199K–499K/bulan.

### Add-on Catalog
| Add-on | Harga | Est. Konversi |
|---|---|---|
| 📺 Embed livestream YouTube/Zoom | Rp 29.000 | 25% |
| 🎥 Upload video ucapan dari tamu | Rp 39.000 | 20% |
| 📱 QR code absensi digital | Rp 19.000 | 35% |
| 💌 Undangan PDF elegant (cetak sendiri) | Rp 49.000 | 15% |
| 🔔 Reminder RSVP otomatis via WA | Rp 29.000 | 30% |
| 🎵 Upload musik custom (bukan library) | Rp 19.000 | 40% |

---

## 3. Product Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      LibraDigital Platform                      │
├─────────────────┬───────────────────────┬───────────────────────┤
│   PUBLIC SITE   │    CREATOR DASHBOARD  │    ADMIN PANEL        │
│                 │                       │                       │
│  Landing Page   │  Stepper UI (7 steps) │  Kelola undangan      │
│  Demo undangan  │  Preview real-time    │  Kelola template      │
│  Pricing page   │  Order history        │  Kelola WO reseller   │
│  Blog/SEO       │  Download QR          │  Analytics revenue    │
│                 │  Perpanjang aktif     │  Animation Builder    │
├─────────────────┴───────────────────────┴───────────────────────┤
│                    WO RESELLER DASHBOARD                        │
│  Daftar klien · Komisi berjalan · Referral link · Withdraw      │
├─────────────────────────────────────────────────────────────────┤
│                     INVITATION PAGE                             │
│  yourdomain.com/[slug]?to=NamaTamu                              │
│  Tema CSS/GSAP/WebGL · RSVP · Gallery · Maps · Gift            │
└─────────────────────────────────────────────────────────────────┘
```

### User Roles
| Role | Akses |
|---|---|
| `guest` | Lihat landing page, demo, pricing |
| `user` | Buat & kelola undangan sendiri |
| `reseller` | Dashboard WO, lihat klien & komisi |
| `admin` | Full akses + Animation Builder |
| `superadmin` | Termasuk konfigurasi sistem & white label |

---

## 4. Tech Stack

### Backend
```
PHP 8.4 + Laravel 13
├── Inertia.js v3 (server-driven SPA bridge ke React)
├── Laravel Fortify — session-based auth
│   └── login, register, password reset, email verification
├── Laravel Socialite — Google OAuth login
├── Pest 4 + PHPUnit 12 — testing
│   └── termasuk browser-testing plugin (Playwright-backed)
├── Laravel Pint — code style enforcement
└── Larastan — static analysis
```

### Frontend
```
React 19 (via Inertia.js v3)
├── TypeScript
├── Tailwind CSS v4
├── Laravel Wayfinder — typed TS functions untuk routes/controllers
│   └── frontend call backend actions langsung, tanpa hand-written URLs
├── shadcn/ui (komponen UI)
├── React Hook Form + Zod (form validation)
├── Zustand (state management stepper)
├── GSAP (animasi undangan tier Premium)
├── Framer Motion (animasi UI dashboard)
├── Lucide React (icons)
└── Vite (build tool)
```

### Infrastructure
```
Database    : MySQL 8.x
              └── session, queue, cache semua pakai database driver (no Redis)
Storage     : Cloudflare R2 via Laravel s3 filesystem driver (foto undangan)
CDN         : Cloudflare (aset statis)
Email       : Resend.com atau Mailgun
WA Notif    : Fonnte API atau WA Business Cloud API
Payment     : Midtrans Snap.js (upgrade flow)
Deploy      : Laravel Forge + Hetzner VPS (CX31)
SSL         : Let's Encrypt via Forge
```

### Architecture Note — Inertia Monolith (Bukan Decoupled API)

```
Blade renders root shell (app.blade.php)
  └── termasuk SSR untuk OG meta tags di halaman publik undangan
      (menggunakan @inertiajs/react SSR mode + Node.js SSR server)

Inertia handles semua navigasi antar page (server-driven)
  └── TIDAK ada REST API layer terpisah
  └── Wayfinder generate typed TS functions dari routes/controllers

Pure JSON endpoints (unauthenticated, pakai fetch wrapper — bukan Inertia router):
  └── POST /rsvp/{slug}        ← submit RSVP dari tamu
  └── POST /invitation/{slug}/visit ← visitor counter
```

---

## 5. Project Structure

```
libradigital/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/
│   │   │   ├── InvitationController.php      ← CRUD undangan
│   │   │   ├── StepperController.php         ← Handle 7 step submit
│   │   │   ├── PublicInvitationController.php ← Halaman undangan publik
│   │   │   ├── RSVPController.php
│   │   │   ├── PaymentController.php          ← Midtrans webhook
│   │   │   ├── ResellerController.php
│   │   │   ├── TemplateController.php
│   │   │   └── Admin/
│   │   │       ├── AdminInvitationController.php
│   │   │       └── AnimationBuilderController.php
│   │   └── Middleware/
│   │       ├── InvitationOwner.php
│   │       └── ActiveSubscription.php
│   ├── Models/
│   │   ├── User.php
│   │   ├── Invitation.php                    ← Model utama
│   │   ├── InvitationAddon.php
│   │   ├── InvitationAnimation.php           ← Untuk Animation Builder
│   │   ├── Template.php
│   │   ├── ResellerProfile.php
│   │   ├── ResellerCommission.php
│   │   ├── Order.php
│   │   └── Addon.php
│   ├── Jobs/
│   │   ├── SendRSVPReminderJob.php
│   │   ├── SendExpiryNotificationJob.php
│   │   └── ProcessPhotoUploadJob.php
│   └── Services/
│       ├── MidtransService.php
│       ├── FontteService.php                 ← WA notification
│       ├── CloudflareR2Service.php
│       └── SlugGeneratorService.php
├── resources/
│   ├── js/
│   │   ├── Pages/
│   │   │   ├── Auth/
│   │   │   ├── Dashboard/
│   │   │   │   ├── Index.tsx                 ← Dashboard user
│   │   │   │   └── Orders.tsx
│   │   │   ├── Stepper/
│   │   │   │   ├── Index.tsx                 ← Stepper wrapper
│   │   │   │   ├── Step1CoupleDate.tsx
│   │   │   │   ├── Step2Venue.tsx
│   │   │   │   ├── Step3Photos.tsx
│   │   │   │   ├── Step4LoveStory.tsx
│   │   │   │   ├── Step5DigitalGift.tsx
│   │   │   │   ├── Step6Template.tsx
│   │   │   │   └── Step7Review.tsx
│   │   │   ├── Invitation/
│   │   │   │   └── Show.tsx                  ← Halaman publik undangan
│   │   │   ├── Reseller/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   └── Clients.tsx
│   │   │   └── Admin/
│   │   │       ├── Dashboard.tsx
│   │   │       └── AnimationBuilder.tsx
│   │   ├── Components/
│   │   │   ├── Stepper/
│   │   │   │   ├── StepperNav.tsx
│   │   │   │   ├── StepperProgress.tsx
│   │   │   │   └── PhotoUploader.tsx
│   │   │   ├── Invitation/
│   │   │   │   ├── TemplatePreview.tsx       ← Preview real-time
│   │   │   │   ├── RSVPForm.tsx
│   │   │   │   └── GiftCard.tsx
│   │   │   └── UI/                           ← shadcn/ui components
│   │   ├── stores/
│   │   │   └── stepperStore.ts               ← Zustand state
│   │   └── themes/
│   │       ├── elegant/                      ← CSS + JS per tema
│   │       ├── modern/
│   │       ├── rustic/
│   │       ├── javanese/
│   │       └── sundanese/
│   └── views/
│       └── app.blade.php
├── routes/
│   ├── web.php                               ← Inertia routes
│   ├── api.php                               ← API (webhook, public)
│   └── channels.php
├── database/
│   ├── migrations/
│   └── seeders/
│       ├── TemplateSeeder.php
│       └── AddonSeeder.php
└── tests/
    ├── Feature/
    │   ├── StepperTest.php
    │   └── PaymentTest.php
    └── Unit/
```

---

## 6. Database Schema

### Core Tables

```sql
-- Users (pengguna platform)
users
├── id, name, email, password
├── phone (VARCHAR 20)                        ← untuk WA notif
├── plan ENUM('starter','standard','premium','signature')
└── reseller_id FK → reseller_profiles

-- Undangan
invitations
├── id, user_id FK, slug (UNIQUE)
├── status ENUM('draft','pending_payment','active','expired')
├── package ENUM('starter','standard','premium','signature')
├── bride_name, groom_name
├── bride_father, groom_father
├── timezone VARCHAR(50)                      ← WIB/WITA/WIT
├── akad_at DATETIME, akad_location TEXT, akad_maps_url TEXT
├── resepsi_at DATETIME, resepsi_location TEXT, resepsi_maps_url TEXT
├── cover_photo_key VARCHAR(500)              ← R2 object key
├── love_story TEXT
├── theme_slug VARCHAR(100)
├── is_rsvp_open BOOLEAN DEFAULT true
├── active_until DATE
├── reseller_id FK → reseller_profiles       ← tracking komisi
└── custom_domain VARCHAR(255)               ← Signature tier

-- Gift/rekening (one-to-many)
invitation_gifts
├── id, invitation_id FK
├── type ENUM('bank','ewallet','other')
├── provider VARCHAR(100)                     ← BCA, GoPay, DANA, dll
├── account_number VARCHAR(100)
├── account_name VARCHAR(255)
└── sort_order INT

-- Gallery foto (one-to-many)
invitation_photos
├── id, invitation_id FK
├── photo_key VARCHAR(500)                    ← R2 object key
├── sort_order INT
└── caption VARCHAR(255)

-- RSVP
rsvp_responses
├── id, invitation_id FK
├── guest_name VARCHAR(255)
├── attendance ENUM('hadir','tidak_hadir','mungkin')
├── guest_count INT DEFAULT 1
├── message TEXT
└── created_at

-- Template
templates
├── id, name, slug (UNIQUE)
├── description TEXT
├── thumbnail_url VARCHAR(500)
├── animation_tier ENUM('css','gsap','particle','webgl')
├── available_for JSON                        ← ["standard","premium","signature"]
├── is_active BOOLEAN
└── sort_order INT

-- Order / Transaksi
orders
├── id, user_id FK, invitation_id FK
├── order_number VARCHAR(50) UNIQUE           ← INV-20260101-XXXX
├── status ENUM('pending','paid','failed','refunded')
├── package ENUM('starter','standard','premium','signature')
├── base_amount INT                           ← dalam Rupiah
├── addon_amount INT
├── total_amount INT
├── midtrans_order_id VARCHAR(100)
├── midtrans_transaction_id VARCHAR(100)
├── paid_at TIMESTAMP
└── reseller_commission_amount INT            ← komisi WO jika ada

-- Add-on per Order
order_addons
├── id, order_id FK, addon_id FK
├── price INT
└── metadata JSON                             ← konfigurasi add-on

-- Add-on Master
addons
├── id, name, slug (UNIQUE)
├── description TEXT
├── price INT
├── is_active BOOLEAN
└── compatible_packages JSON                  ← ["standard","premium","signature"]

-- Reseller
reseller_profiles
├── id, user_id FK (UNIQUE)
├── business_name VARCHAR(255)
├── referral_code VARCHAR(20) UNIQUE
├── tier ENUM('mitra','silver','gold','platinum')
├── commission_per_invitation INT             ← dalam Rupiah
├── total_earnings INT
├── withdrawable_balance INT
└── total_invitations_sold INT

-- Komisi Reseller
reseller_commissions
├── id, reseller_id FK, order_id FK, invitation_id FK
├── amount INT
├── status ENUM('pending','approved','withdrawn')
└── created_at

-- Animation Builder (Fase 3)
invitation_animations
├── id, invitation_id FK
├── asset_key VARCHAR(500)                    ← R2 key PNG transparan
├── animation_type VARCHAR(50)               ← float-fall, breathe, sway
├── config JSON                              ← {duration, delay, opacity, scale, x, y}
├── sort_order INT
└── section VARCHAR(50)                      ← hero, gallery, footer
```

---

## 7. The 7-Step Stepper UI

### State Management (Zustand)

```typescript
// stores/stepperStore.ts
interface StepperState {
  currentStep: number
  isDraft: boolean
  data: {
    // Step 1
    bride_name: string
    groom_name: string
    bride_father: string
    groom_father: string
    wedding_date: string
    timezone: 'WIB' | 'WITA' | 'WIT'
    // Step 2
    akad_date: string
    akad_time: string
    akad_location: string
    akad_maps_url: string
    resepsi_date: string
    resepsi_time: string
    resepsi_location: string
    resepsi_maps_url: string
    // Step 3
    cover_photo_key: string
    gallery_photo_keys: string[]
    // Step 4
    love_story: string
    // Step 5
    gifts: GiftAccount[]
    // Step 6
    theme_slug: string
    // Step 7 (no input, review only)
  }
  selectedPackage: 'starter' | 'standard' | 'premium' | 'signature'
  selectedAddons: string[]
  setStep: (step: number) => void
  updateData: (data: Partial<StepperState['data']>) => void
  saveDraft: () => void                       // localStorage
  loadDraft: () => void
}
```

### Step Flow & Validation

```
Step 1: Couple Names + Date + Timezone
  Validasi: bride_name required, groom_name required,
            wedding_date required & harus di masa depan,
            timezone required

Step 2: Venue Details
  Validasi: min 1 event (akad atau resepsi),
            maps_url harus format Google Maps yang valid

Step 3: Photos
  Validasi: cover_photo required,
            gallery max 20 foto, max 5MB per foto,
            format: JPG/PNG/WebP
  Upload: presigned URL langsung ke Cloudflare R2

Step 4: Love Story
  Validasi: opsional, max 2000 karakter
  Note: Hanya tampil di Standard ke atas

Step 5: Digital Gift
  Validasi: opsional, max 5 rekening/e-wallet
  Note: Hanya tampil di Standard ke atas

Step 6: Template Selection
  Tampilkan template sesuai paket yang dipilih
  Preview real-time dengan data dari step 1–5
  User pilih paket DI SINI (pricing card + template)

Step 7: Review + Publish
  Tampil ringkasan semua data
  Tampil add-on upsell (checklist)
  Tombol "Bayar & Publish" → trigger Midtrans Snap
  Setelah bayar → generate slug → redirect ke preview
```

### Slug Generation Logic

```php
// Services/SlugGeneratorService.php
// Format: {bride-slug}-{groom-slug}
// Contoh: "Rina Kartika" + "Budi Santoso" → "rina-budi"
// Kalau sudah ada: "rina-budi-2", "rina-budi-3", dst.

public function generate(string $brideName, string $groomName): string
{
    $base = Str::slug(
        Str::of($brideName)->explode(' ')->first() . '-' .
        Str::of($groomName)->explode(' ')->first()
    );
    // cek keunikan, tambah suffix angka kalau perlu
}
```

### Photo Upload Flow

```
User pilih foto di browser
  → Frontend: minta presigned URL dari /api/upload/presign
  → Backend: generate R2 presigned PUT URL (expire 10 menit)
  → Frontend: PUT foto langsung ke R2 (bypass server)
  → Frontend: simpan object key ke Zustand state
  → Saat publish: object key disimpan ke DB invitations table
```

---

## 8. Pricing & Packages

### Package Feature Matrix

| Fitur | Starter | Standard | Premium | Signature |
|---|:---:|:---:|:---:|:---:|
| Harga | Rp 99K | Rp 179K | Rp 299K | Rp 599K |
| Durasi aktif | 3 bulan | 6 bulan | 12 bulan | Selamanya |
| Jumlah template | 3 | 10+ | 10+ | Semua |
| Cover photo | ✓ | ✓ | ✓ | ✓ |
| Gallery foto | ✗ | ✓ (20 foto) | ✓ (50 foto) | ✓ (100 foto) |
| Love story | ✗ | ✓ | ✓ | ✓ |
| Digital gift | ✗ | ✓ | ✓ | ✓ |
| Musik background | ✗ | Library | Custom upload | Custom upload |
| Animasi level | CSS | CSS | GSAP + Particle | WebGL / 3D |
| Custom subdomain | ✗ | ✗ | ✓ | ✓ |
| Custom domain | ✗ | ✗ | ✗ | ✓ |
| Animation Builder | ✗ | ✗ | ✗ | ✓ |
| RSVP form | ✓ | ✓ | ✓ | ✓ |
| Personalisasi `?to=` | ✓ | ✓ | ✓ | ✓ |
| Google Maps | ✓ | ✓ | ✓ | ✓ |
| Countdown timer | ✓ | ✓ | ✓ | ✓ |
| Export RSVP CSV | ✗ | ✓ | ✓ | ✓ |
| Dedicated WA support | ✗ | ✗ | ✗ | ✓ |

### Pricing Psychology
- **Starter** → anchor bawah, buat Standard kelihatan murah
- **Standard** → badge "Paling Populer", target penjualan utama
- **Premium** → buat Standard terasa reasonable
- **Signature** → aspirasional, margin tertinggi, buat Premium kelihatan terjangkau

### Renewal Pricing
```
Starter  → Rp 39.000 / 3 bulan
Standard → Rp 49.000 / 6 bulan
Premium  → Rp 79.000 / 12 bulan
```

---

## 9. Partner & Reseller System

### WO Reseller Tier

| Tier | Syarat | Komisi/Undangan | Benefit |
|---|---|---|---|
| Mitra | 0 undangan/bulan | Rp 20.000 | Dashboard + referral link |
| Silver | 5+/bulan | Rp 35.000 | Custom URL branding |
| Gold | 15+/bulan | Rp 50.000 | Logo WO di undangan klien |
| Platinum | 30+/bulan | Rp 75.000 | White label subdomain |

### Referral Flow

```
WO share link: yourdomain.com/buat?ref=KODEVO

Klien buat undangan via link reseller
  → invitation.reseller_id = reseller.id

Order paid
  → Buat record reseller_commissions
  → status: 'pending' (hold 7 hari untuk antisipasi refund)
  → Setelah 7 hari: status 'approved'
  → WO withdraw via dashboard → transfer manual atau otomatis
```

### WO Dashboard Features
- Daftar semua klien dan status undangan mereka
- Saldo komisi berjalan (pending vs withdrawable)
- Referral link dengan tracking
- Request withdraw (min. Rp 100.000)
- Download laporan komisi (CSV)

---

## 10. Payment Integration

### Midtrans Flow

```php
// Services/MidtransService.php
public function createTransaction(Order $order): array
{
    return \Midtrans\Snap::createTransaction([
        'transaction_details' => [
            'order_id'     => $order->order_number,
            'gross_amount' => $order->total_amount,
        ],
        'customer_details' => [
            'first_name' => $order->user->name,
            'email'      => $order->user->email,
            'phone'      => $order->user->phone,
        ],
        'item_details' => $this->buildItemDetails($order),
        'callbacks'    => [
            'finish' => route('payment.finish'),
        ],
    ]);
}
```

### Webhook Handler

```
POST /api/payment/webhook/midtrans

Validasi signature key
  → status 'settlement' atau 'capture':
      → Order::update(['status' => 'paid', 'paid_at' => now()])
      → Invitation::update(['status' => 'active', 'active_until' => ...])
      → Dispatch: ProcessPhotoUploadJob (pindah R2 temp → permanent)
      → Dispatch: SendWelcomeNotificationJob (WA ke klien)
      → Jika ada reseller: buat ResellerCommission record
  → status 'expire' atau 'cancel':
      → Order::update(['status' => 'failed'])
      → Invitation::update(['status' => 'draft'])
```

---

## 11. Template & Animation System

### Animation Tier

| Tier | Package | Teknologi | Contoh |
|---|---|---|---|
| 1 — CSS | Starter, Standard | CSS3 transitions, keyframes | fade-in, slide-up, float |
| 2 — GSAP | Premium | GSAP ScrollTrigger, stagger | parallax hero, stagger gallery |
| 3 — Particle | Premium | tsParticles | kelopak bunga jatuh, bintang |
| 4 — WebGL | Signature | Three.js, shader | 3D scene, cinematic opening |

### Template File Structure

```
resources/js/themes/
└── elegant/
    ├── index.tsx          ← wrapper tema, import semua section
    ├── HeroSection.tsx
    ├── CountdownSection.tsx
    ├── StorySection.tsx
    ├── EventSection.tsx
    ├── GallerySection.tsx
    ├── RSVPSection.tsx
    ├── GiftSection.tsx
    ├── Footer.tsx
    ├── theme.css          ← CSS variables tema ini
    └── animations.ts      ← GSAP setup (untuk Premium+)
```

### Template Props (Semua Tema Pakai Interface yang Sama)

```typescript
// types/invitation.ts
interface InvitationData {
  bride_name: string
  groom_name: string
  bride_father?: string
  groom_father?: string
  wedding_date: string
  timezone: string
  akad?: EventDetail
  resepsi?: EventDetail
  cover_photo_url: string
  gallery_photo_urls: string[]
  love_story?: string
  gifts: GiftAccount[]
  guest_name?: string              // dari ?to= query param
  rsvp_open: boolean
}

// SEMUA tema harus accept props ini — tidak boleh ada perbedaan interface
// Ini yang memungkinkan 1 data = N tema, dan migrasi mudah
```

### Personalisasi Nama Tamu

```typescript
// Di halaman publik undangan
const guestName = new URLSearchParams(window.location.search).get('to')
  ?? 'Tamu Undangan'

// URL contoh:
// nikahkit.com/rina-budi?to=Pak+Hendra+Kurniawan
```

---

## 12. File Storage Strategy

### Cloudflare R2 Bucket Structure

```
bucket: nikahkit-media
├── temp/
│   └── {user_id}/{timestamp}-{filename}     ← Upload saat stepper (belum bayar)
└── invitations/
    └── {invitation_slug}/
        ├── cover.webp                        ← Di-convert ke WebP
        └── gallery/
            ├── 001.webp
            ├── 002.webp
            └── ...
```

### Image Processing (setelah bayar)

```php
// Jobs/ProcessPhotoUploadJob.php
// 1. Ambil dari R2 temp/
// 2. Resize: cover → 1200×800, gallery → 800×800
// 3. Convert ke WebP (80% quality)
// 4. Upload ke invitations/{slug}/
// 5. Hapus dari temp/
// 6. Update DB dengan URL baru
```

### Presigned URL untuk Upload

```php
// Controllers/UploadController.php
public function presign(Request $request)
{
    $key = "temp/{$request->user()->id}/" . Str::uuid() . '-' . $request->filename;
    $url = $this->r2->presignedPutUrl($key, expiresIn: 600); // 10 menit
    return response()->json(['upload_url' => $url, 'key' => $key]);
}
```

---

## 13. Notification System

### WhatsApp Notifications (via Fonnte API)

| Trigger | Pesan |
|---|---|
| Pembayaran sukses | "Undangan Kak {nama} sudah aktif! Lihat di: {link}" |
| Undangan H-14 expired | "Undangan Kak {nama} kadaluarsa 14 hari lagi. Perpanjang: {link}" |
| Undangan H-3 expired | "Pengingat terakhir: undangan kadaluarsa 3 hari lagi." |
| Ada RSVP masuk | "1 tamu baru RSVP ke undangan Kak {nama}: {nama_tamu} - Hadir" |
| WO komisi approved | "Komisi Rp {amount} dari klien {nama} siap dicairkan!" |

### RSVP Reminder (untuk tamu)

Fitur add-on: RSVP Reminder via WA. Sistem kirim WA ke semua tamu yang belum RSVP H-7 sebelum akad, menggunakan data nomor yang diinput saat RSVP.

---

## 14. Roadmap

### Fase 1 — MVP Stepper (Bulan 0–3)
- [ ] Auth (register, login, forgot password)
- [ ] Stepper UI 7 langkah
- [ ] Upload foto ke Cloudflare R2
- [ ] 3 template: Elegant, Modern, Javanese
- [ ] Animasi CSS Tier 1
- [ ] Payment Midtrans Snap
- [ ] Halaman publik undangan + personalisasi `?to=`
- [ ] RSVP form
- [ ] WA notif via Fonnte (pembayaran sukses)
- [ ] Dashboard user (lihat & kelola undangan)
- [ ] Landing page + pricing page

### Fase 2 — Partner & Volume (Bulan 3–9)
- [ ] Reseller/WO registration & dashboard
- [ ] Komisi otomatis + withdrawal system
- [ ] 10+ template (tambah Sundanese, Minang, Batak, Modern Dark)
- [ ] Animasi GSAP Tier 2 untuk Premium
- [ ] Add-on checkout (livestream, QR absensi, dll)
- [ ] Perpanjangan aktif dari dashboard
- [ ] Export RSVP ke CSV
- [ ] WA notif kadaluarsa (H-14, H-3)
- [ ] Affiliate link tracking
- [ ] Blog/SEO (Next.js atau Nuxt untuk landing, atau tambahkan ke Laravel)

### Fase 3 — SaaS Full (Bulan 9–18)
- [ ] Template marketplace (submit + review + komisi desainer)
- [ ] Custom domain via Cloudflare API (Signature tier)
- [ ] Animation Builder untuk admin/operator
- [ ] Particle effects Tier 3 (tsParticles)
- [ ] RSVP Reminder otomatis via WA (add-on)
- [ ] Email automation (Resend)
- [ ] Admin panel analytics (revenue, conversion rate, top template)
- [ ] White label B2B (sub-platform branding sendiri)

### Fase 4 — Market Leader (Bulan 18–30)
- [ ] WebGL / Three.js Tier 4 untuk Signature
- [ ] Animation Builder v2 (keyframe editor visual)
- [ ] Asset library PNG transparan (ornamen, bunga, dll)
- [ ] Public API untuk integrasi pihak ketiga
- [ ] Ekspansi vertikal: undangan sunatan, ulang tahun, acara korporat
- [ ] Mobile app (React Native) untuk WO dashboard

---

## 15. Getting Started

### Prerequisites
- PHP 8.4+
- Composer 2
- Node.js 20+
- MySQL 8.x
- Cloudflare R2 bucket (atau MinIO untuk local dev)
- Node.js SSR server untuk Inertia SSR (dijalankan terpisah)

### Installation

```bash
# Clone repo
git clone https://github.com/yourusername/libradigital.git
cd libradigital

# Install PHP dependencies
composer install

# Install JS dependencies
npm install

# Copy env
cp .env.example .env
php artisan key:generate

# Database (session, queue, cache semua pakai DB driver)
php artisan migrate
php artisan db:seed

# Build assets
npm run dev

# Queue worker (terminal terpisah — pakai database driver)
php artisan queue:work --queue=default,photos,notifications

# SSR server untuk Inertia (terminal terpisah)
node bootstrap/ssr/ssr.js

# Run server
php artisan serve
```

### Seeding Data Awal

```bash
# Seed template
php artisan db:seed --class=TemplateSeeder

# Seed add-on catalog
php artisan db:seed --class=AddonSeeder

# Seed demo user (untuk development)
php artisan db:seed --class=DemoUserSeeder
```

---

## 16. Environment Variables

```env
APP_NAME=LibraDigital
APP_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_DATABASE=libradigital
DB_USERNAME=root
DB_PASSWORD=

# Session, queue, cache — semua pakai database driver
SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database

# Cloudflare R2 — via Laravel s3 filesystem driver
AWS_ACCESS_KEY_ID=          # R2 Access Key ID
AWS_SECRET_ACCESS_KEY=      # R2 Secret Access Key
AWS_DEFAULT_REGION=auto
AWS_BUCKET=libradigital-media
AWS_ENDPOINT=https://{account_id}.r2.cloudflarestorage.com
AWS_USE_PATH_STYLE_ENDPOINT=true
R2_PUBLIC_URL=https://media.yourdomain.com

# Midtrans
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false

# Google OAuth (Socialite)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI="${APP_URL}/auth/google/callback"

# WhatsApp (Fonnte)
FONNTE_TOKEN=

# Email
RESEND_API_KEY=

# Inertia SSR
INERTIA_SSR_ENABLED=true
INERTIA_SSR_URL=http://127.0.0.1:13714

# Cloudflare (untuk custom domain Signature tier)
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=
```

---

## 17. Claude Code Prompts

Gunakan prompt-prompt ini saat bekerja dengan Claude Code untuk scaffold bagian-bagian penting:

### Scaffold Auth (Fortify + Socialite)

```
Stack: PHP 8.4, Laravel 13, Laravel Fortify, Laravel Socialite, Inertia.js v3, React 19.
Buat auth lengkap dengan:
- Laravel Fortify untuk: login, register, password reset, email verification
- Laravel Socialite untuk: Google OAuth (route /auth/google dan /auth/google/callback)
- Inertia pages: Auth/Login.tsx, Auth/Register.tsx, Auth/ForgotPassword.tsx,
  Auth/ResetPassword.tsx, Auth/VerifyEmail.tsx
- Semua form pakai React Hook Form + Zod + shadcn/ui, Tailwind CSS v4
- Setelah login redirect ke /dashboard
- Google OAuth simpan atau update user berdasarkan email (upsert)
```

### Scaffold Model + Migration

```
Stack: PHP 8.4, Laravel 13. Pest 4 untuk testing.
Buat Laravel model, migration, dan factory untuk tabel "invitations" sesuai schema 
di README.md bagian Database Schema. Sertakan:
- Model dengan fillable, casts, relationships (user, gifts, photos, rsvp_responses, order)
- Migration lengkap dengan semua kolom dan index
- Factory untuk Pest testing
- Tidak menggunakan Spatie Media Library — file key disimpan langsung sebagai string
```

### Scaffold Stepper (Inertia Monolith)

```
Stack: Laravel 13, Inertia.js v3, React 19, TypeScript, Laravel Wayfinder.
Arsitektur: Inertia monolith — TIDAK ada REST API layer. Semua form submit via 
Inertia router (useForm). Gunakan Wayfinder untuk typed route references.

Buat StepperController dengan Inertia actions:
- GET  /invitation/create       → render Stepper/Index (Inertia::render)
- POST /invitation/draft        → simpan draft ke DB sessions (database driver)
- GET  /invitation/draft        → ambil draft dari session
- POST /invitation/upload/presign → generate R2 presigned PUT URL (pure JSON, bukan Inertia)
- POST /invitation/publish      → simpan semua data + buat Order + trigger Midtrans

Buat Stepper/Index.tsx dengan 7 steps menggunakan Zustand state + React Hook Form + Zod.
Steps: (1) Couple Names + Date + Timezone, (2) Venue Akad + Resepsi + Maps URL,
(3) Photo upload cover + gallery ke R2 via presigned URL, (4) Love Story text,
(5) Digital Gift accounts, (6) Template selection + preview real-time,
(7) Review + add-on selection + Midtrans Snap.js payment trigger.
Mobile-first, Tailwind CSS v4, shadcn/ui.
```

### Scaffold Template System + SSR Meta Tags

```
Stack: Laravel 13, Inertia.js v3, React 19, @inertiajs/react SSR mode.
Buat sistem halaman publik undangan:

Backend:
- Route GET /{slug} → PublicInvitationController@show
- Cek invitation.status === 'active' dan active_until >= today
- Pass data via Inertia::render('Invitation/Show', [...])
- Di HandleInertiaRequests middleware: inject OG meta tags (title, image, description)
  untuk SSR — ini yang di-render Blade saat first load untuk SEO/WhatsApp preview

Frontend:
- Invitation/Show.tsx: terima InvitationData props dari Inertia
- Guest name dari URL: const guest = new URLSearchParams(window.location.search).get('to')
- Sections: Hero, Countdown, Story, Event (Akad+Resepsi), Gallery lightbox, RSVP, Gift, Footer
- RSVP submit via plain fetch (bukan Inertia router) ke POST /rsvp/{slug}
- CSS tema di-scope per tema agar tidak konflik dengan dashboard styles
- Semua tema pakai interface InvitationData yang sama persis
```

### Scaffold Reseller System

```
Stack: Laravel 13, Inertia.js v3, React 19, Wayfinder.
Buat sistem reseller WO:
- Model ResellerProfile dan ResellerCommission
- Middleware EnsureIsReseller
- ResellerController dengan Inertia actions: dashboard stats, daftar klien, 
  saldo komisi, request withdrawal
- Trait HasReseller di model Invitation
- Job ProcessResellerCommission (database queue) dipanggil setelah payment webhook
- Inertia pages: Reseller/Dashboard.tsx dan Reseller/Clients.tsx
- Gunakan Wayfinder untuk semua route references di frontend
```

### Scaffold Midtrans Webhook

```
Stack: Laravel 13. Queue driver: database (bukan Redis).
Buat Midtrans payment webhook handler:
- Route POST /payment/webhook/midtrans (exclude dari CSRF middleware, masuk api.php)
- Validasi signature key Midtrans
- Handle status: settlement, capture, expire, cancel, deny
- Setelah payment sukses (dalam DB transaction):
  1. Order::update(['status' => 'paid', 'paid_at' => now()])
  2. Invitation::update(['status' => 'active', 'active_until' => ...sesuai paket])
  3. dispatch(new ProcessPhotoUploadJob($invitation))  ← database queue
  4. dispatch(new SendWelcomeWAJob($invitation))        ← database queue
  5. Buat ResellerCommission jika invitation->reseller_id tidak null
- Gunakan Pest 4 untuk test webhook dengan berbagai status payload
```

### Scaffold Wayfinder Usage

```
Stack: Laravel 13, Laravel Wayfinder, TypeScript, React 19.
Jelaskan dan terapkan Laravel Wayfinder di project ini:
- Jalankan: php artisan wayfinder:generate untuk generate typed TS actions
- Contoh penggunaan di React component: import {show} from '@/actions/InvitationController'
  lalu router.get(show({slug: invitation.slug})) — bukan hardcode string URL
- Buat contoh penggunaan di: Stepper submit, Dashboard link ke edit/view, 
  Reseller dashboard link ke klien
- Buat juga typed fetch wrapper untuk pure JSON endpoints (RSVP, visitor counter)
  yang tidak pakai Inertia router
```

---

## Business Contacts & Resources

| Resource | Link/Info |
|---|---|
| Midtrans Dashboard | https://dashboard.midtrans.com |
| Cloudflare R2 | https://dash.cloudflare.com → R2 |
| Fonnte WA API | https://fonnte.com |
| Resend Email | https://resend.com |
| Google OAuth Console | https://console.cloud.google.com → Credentials |
| Laravel Fortify Docs | https://laravel.com/docs/fortify |
| Laravel Socialite Docs | https://laravel.com/docs/socialite |
| Laravel Wayfinder | https://github.com/laravel/wayfinder |
| Inertia.js v3 Docs | https://inertiajs.com |
| GSAP License | https://gsap.com (free untuk non-commercial, beli Club untuk prod) |
| tsParticles | https://particles.js.org (MIT license) |
| shadcn/ui | https://ui.shadcn.com |

---

*README ini adalah living document. Update setiap kali ada perubahan arsitektur signifikan.*

*Last updated: Juli 2026 — Stack: PHP 8.4 · Laravel 13 · React 19 · Inertia v3 · Wayfinder · Fortify · Socialite · MySQL (all drivers) · Cloudflare R2*