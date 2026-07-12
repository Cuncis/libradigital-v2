import { Head, router, useForm } from '@inertiajs/react';
import { Check, Loader2, Lock, Trash2, Upload } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import InvitationController from '@/actions/App/Http/Controllers/InvitationController';
import OrderController from '@/actions/App/Http/Controllers/OrderController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { postJson } from '@/lib/api';
import { formatRupiah } from '@/lib/format';
import { loadSnap } from '@/lib/midtrans';
import { dashboard } from '@/routes';
import type {
    Addon,
    Animation,
    AnimationSection,
    AnimationSectionOption,
    GiftType,
    InvitationTemplate,
    Package,
    PackageTier,
    PublicInvitation,
} from '@/types/invitation';

interface Props {
    invitation: PublicInvitation;
    templates: InvitationTemplate[];
    animationLibrary: Animation[];
    animationSections: AnimationSectionOption[];
    packages: Package[];
    addons: Addon[];
    midtrans: {
        client_key: string;
        is_production: boolean;
    };
}

const ANIMATION_SECTIONS: AnimationSection[] = [
    'cover',
    'header',
    'countdown',
    'love_story',
    'rsvp',
    'gift',
];

/** Build the initial { section: animation_id|null } map from the invitation. */
function initialAnimations(
    invitation: PublicInvitation,
): Record<AnimationSection, number | null> {
    const map = {} as Record<AnimationSection, number | null>;

    for (const section of ANIMATION_SECTIONS) {
        map[section] = invitation.animations?.[section]?.id ?? null;
    }

    return map;
}

const STEPS = [
    'Mempelai',
    'Lokasi',
    'Foto',
    'Kisah',
    'Angpao',
    'Template',
    'Animasi',
    'Review',
];

const toLocalInput = (iso: string | null) => (iso ? iso.slice(0, 16) : '');

const PACKAGE_RANK: Record<PackageTier, number> = {
    starter: 1,
    standard: 2,
    premium: 3,
    signature: 4,
};

const PACKAGE_LABEL: Record<PackageTier, string> = {
    starter: 'Starter',
    standard: 'Standard',
    premium: 'Premium',
    signature: 'Signature',
};

export default function Builder({
    invitation,
    templates,
    animationLibrary,
    animationSections,
    packages,
    addons,
    midtrans,
}: Props) {
    const [step, setStep] = useState(0);

    const form = useForm({
        groom_name: invitation.groom_name ?? '',
        bride_name: invitation.bride_name ?? '',
        wedding_date: toLocalInput(invitation.wedding_date),
        timezone: invitation.timezone,
        akad_venue: invitation.akad_venue ?? '',
        akad_address: invitation.akad_address ?? '',
        akad_datetime: toLocalInput(invitation.akad_datetime),
        resepsi_venue: invitation.resepsi_venue ?? '',
        resepsi_address: invitation.resepsi_address ?? '',
        resepsi_datetime: toLocalInput(invitation.resepsi_datetime),
        maps_url_akad: invitation.maps_url_akad ?? '',
        maps_url_resepsi: invitation.maps_url_resepsi ?? '',
        love_story: invitation.love_story ?? '',
        template_id: invitation.template_id,
        animations: initialAnimations(invitation),
    });

    const [savedAt, setSavedAt] = useState<string | null>(null);

    const save = useCallback(() => {
        form.put(InvitationController.update(invitation.id).url, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setSavedAt(new Date().toLocaleTimeString('id-ID')),
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [invitation.id, form.data]);

    // Autosave draft every 30 seconds when there are unsaved changes.
    useEffect(() => {
        const id = setInterval(() => {
            if (form.isDirty) {
                save();
            }
        }, 30_000);

        return () => clearInterval(id);
    }, [form.isDirty, save]);

    const goTo = (next: number) => {
        if (form.isDirty) {
            save();
        }

        setStep(next);
    };

    return (
        <>
            <Head title="Builder Undangan" />
            <div className="mx-auto w-full max-w-3xl p-4">
                <Stepper current={step} onStep={goTo} />

                <div className="mt-6 rounded-xl border p-6">
                    {step === 0 && <CoupleStep form={form} />}
                    {step === 1 && <VenueStep form={form} />}
                    {step === 2 && <PhotosStep invitation={invitation} />}
                    {step === 3 && <StoryStep form={form} />}
                    {step === 4 && <GiftStep invitation={invitation} />}
                    {step === 5 && (
                        <TemplateStep form={form} templates={templates} />
                    )}
                    {step === 6 && (
                        <AnimationStep
                            form={form}
                            library={animationLibrary}
                            sections={animationSections}
                        />
                    )}
                    {step === 7 && (
                        <ReviewStep
                            invitation={invitation}
                            packages={packages}
                            addons={addons}
                            midtrans={midtrans}
                            selectedTemplate={templates.find(
                                (t) => t.id === form.data.template_id,
                            )}
                        />
                    )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                        {form.processing
                            ? 'Menyimpan…'
                            : savedAt
                              ? `Tersimpan ${savedAt}`
                              : 'Perubahan disimpan otomatis'}
                    </span>
                    <div className="flex gap-2">
                        {step > 0 && (
                            <Button
                                variant="outline"
                                onClick={() => goTo(step - 1)}
                            >
                                Kembali
                            </Button>
                        )}
                        {step < STEPS.length - 1 ? (
                            <Button onClick={() => goTo(step + 1)}>
                                Lanjut
                            </Button>
                        ) : null}
                    </div>
                </div>
            </div>
        </>
    );
}

function Stepper({
    current,
    onStep,
}: {
    current: number;
    onStep: (n: number) => void;
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {STEPS.map((label, index) => (
                <button
                    key={label}
                    onClick={() => onStep(index)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition ${
                        index === current
                            ? 'border-rose-400 bg-rose-50 font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                            : index < current
                              ? 'border-transparent text-muted-foreground'
                              : 'border-transparent text-muted-foreground'
                    }`}
                >
                    <span className="flex size-5 items-center justify-center rounded-full bg-muted text-xs">
                        {index < current ? (
                            <Check className="size-3" />
                        ) : (
                            index + 1
                        )}
                    </span>
                    {label}
                </button>
            ))}
        </div>
    );
}

type Form = ReturnType<typeof useForm<any>>;

function Field({
    label,
    name,
    children,
}: {
    label: string;
    name?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={name}>{label}</Label>
            {children}
        </div>
    );
}

function CoupleStep({ form }: { form: Form }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama Mempelai Pria" name="groom_name">
                <Input
                    id="groom_name"
                    name="groom_name"
                    value={form.data.groom_name}
                    onChange={(e) => form.setData('groom_name', e.target.value)}
                />
            </Field>
            <Field label="Nama Mempelai Wanita" name="bride_name">
                <Input
                    id="bride_name"
                    name="bride_name"
                    value={form.data.bride_name}
                    onChange={(e) => form.setData('bride_name', e.target.value)}
                />
            </Field>
            <Field label="Tanggal &amp; Waktu Pernikahan" name="wedding_date">
                <Input
                    id="wedding_date"
                    name="wedding_date"
                    type="datetime-local"
                    value={form.data.wedding_date}
                    onChange={(e) =>
                        form.setData('wedding_date', e.target.value)
                    }
                />
            </Field>
            <Field label="Zona Waktu" name="timezone">
                <select
                    id="timezone"
                    name="timezone"
                    value={form.data.timezone}
                    onChange={(e) => form.setData('timezone', e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                    <option value="WIB">WIB</option>
                    <option value="WITA">WITA</option>
                    <option value="WIT">WIT</option>
                </select>
            </Field>
        </div>
    );
}

function VenueStep({ form }: { form: Form }) {
    return (
        <div className="grid gap-6">
            {(['akad', 'resepsi'] as const).map((kind) => (
                <div key={kind} className="grid gap-4">
                    <h3 className="font-medium capitalize">
                        {kind === 'akad' ? 'Akad Nikah' : 'Resepsi'}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Nama Tempat" name={`${kind}_venue`}>
                            <Input
                                id={`${kind}_venue`}
                                name={`${kind}_venue`}
                                value={form.data[`${kind}_venue`]}
                                onChange={(e) =>
                                    form.setData(
                                        `${kind}_venue`,
                                        e.target.value,
                                    )
                                }
                            />
                        </Field>
                        <Field label="Waktu" name={`${kind}_datetime`}>
                            <Input
                                id={`${kind}_datetime`}
                                name={`${kind}_datetime`}
                                type="datetime-local"
                                value={form.data[`${kind}_datetime`]}
                                onChange={(e) =>
                                    form.setData(
                                        `${kind}_datetime`,
                                        e.target.value,
                                    )
                                }
                            />
                        </Field>
                        <Field label="Alamat" name={`${kind}_address`}>
                            <Input
                                id={`${kind}_address`}
                                name={`${kind}_address`}
                                value={form.data[`${kind}_address`]}
                                onChange={(e) =>
                                    form.setData(
                                        `${kind}_address`,
                                        e.target.value,
                                    )
                                }
                            />
                        </Field>
                        <Field
                            label="Link Google Maps"
                            name={`maps_url_${kind}`}
                        >
                            <Input
                                id={`maps_url_${kind}`}
                                name={`maps_url_${kind}`}
                                value={form.data[`maps_url_${kind}`]}
                                onChange={(e) =>
                                    form.setData(
                                        `maps_url_${kind}`,
                                        e.target.value,
                                    )
                                }
                                placeholder="https://maps.google.com/…"
                            />
                        </Field>
                    </div>
                </div>
            ))}
        </div>
    );
}

function PhotosStep({ invitation }: { invitation: PublicInvitation }) {
    const [uploading, setUploading] = useState(false);

    const uploadCover = (file: File) => {
        router.post(
            InvitationController.uploadCover(invitation.id).url,
            { cover: file },
            { forceFormData: true, preserveScroll: true },
        );
    };

    const uploadGallery = (files: FileList) => {
        setUploading(true);
        router.post(
            InvitationController.uploadPhotos(invitation.id).url,
            { photos: Array.from(files) },
            {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => setUploading(false),
            },
        );
    };

    const deletePhoto = (photoId: number) => {
        router.delete(
            InvitationController.deletePhoto([invitation.id, photoId]).url,
            { preserveScroll: true },
        );
    };

    return (
        <div className="grid gap-6">
            <Field label="Foto Sampul (Cover)">
                <div className="flex items-center gap-4">
                    {invitation.cover_photo && (
                        <img
                            src={invitation.cover_photo}
                            alt="cover"
                            className="h-20 w-16 rounded object-cover"
                        />
                    )}
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                        <Upload className="size-4" /> Pilih Foto
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) =>
                                e.target.files?.[0] &&
                                uploadCover(e.target.files[0])
                            }
                        />
                    </label>
                </div>
            </Field>

            <Field label="Galeri Foto">
                <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                    {uploading ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        <Upload className="size-4" />
                    )}
                    Tambah Foto
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) =>
                            e.target.files && uploadGallery(e.target.files)
                        }
                    />
                </label>
                <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {invitation.gallery_photos.map((photo) => (
                        <div key={photo.id} className="group relative">
                            <img
                                src={photo.photo_url}
                                alt=""
                                className="aspect-square w-full rounded object-cover"
                            />
                            <button
                                onClick={() => deletePhoto(photo.id)}
                                className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                            >
                                <Trash2 className="size-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            </Field>
        </div>
    );
}

function StoryStep({ form }: { form: Form }) {
    return (
        <Field label="Kisah Cinta / Love Story" name="love_story">
            <textarea
                id="love_story"
                name="love_story"
                value={form.data.love_story}
                onChange={(e) => form.setData('love_story', e.target.value)}
                rows={8}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Ceritakan perjalanan cinta kalian…"
            />
        </Field>
    );
}

function AnimationStep({
    form,
    library,
    sections,
}: {
    form: Form;
    library: Animation[];
    sections: AnimationSectionOption[];
}) {
    const selections = form.data.animations as Record<
        AnimationSection,
        number | null
    >;

    const setSection = (section: AnimationSection, value: number | null) => {
        form.setData('animations', { ...selections, [section]: value });
    };

    return (
        <div className="grid gap-5">
            <p className="text-sm text-muted-foreground">
                Pilih animasi untuk tiap bagian undangan. Biarkan “Bawaan” untuk
                memakai animasi standar.
            </p>
            {sections.map((section) => {
                const options = library.filter(
                    (a) => a.section === section.value,
                );

                return (
                    <Field
                        key={section.value}
                        label={section.label}
                        name={`animation-${section.value}`}
                    >
                        <select
                            id={`animation-${section.value}`}
                            value={selections[section.value] ?? ''}
                            onChange={(e) =>
                                setSection(
                                    section.value,
                                    e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                )
                            }
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <option value="">Bawaan (default)</option>
                            {options.map((animation) => (
                                <option key={animation.id} value={animation.id}>
                                    {animation.name} — {animation.effect_label}
                                </option>
                            ))}
                        </select>
                        {options.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                                Belum ada animasi untuk bagian ini.
                            </p>
                        )}
                    </Field>
                );
            })}
        </div>
    );
}

function GiftStep({ invitation }: { invitation: PublicInvitation }) {
    const [gifts, setGifts] = useState(
        invitation.gift_accounts.map((g) => ({
            type: g.type,
            provider_name: g.provider_name,
            account_number: g.account_number,
            account_name: g.account_name,
        })),
    );
    const [saved, setSaved] = useState(false);

    const update = (i: number, key: string, value: string) => {
        setGifts((prev) =>
            prev.map((g, idx) => (idx === i ? { ...g, [key]: value } : g)),
        );
    };

    const add = () =>
        setGifts((prev) => [
            ...prev,
            {
                type: 'bank' as GiftType,
                provider_name: '',
                account_number: '',
                account_name: '',
            },
        ]);

    const remove = (i: number) =>
        setGifts((prev) => prev.filter((_, idx) => idx !== i));

    const saveGifts = () => {
        router.put(
            InvitationController.syncGifts(invitation.id).url,
            { gifts },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSaved(true);
                    setTimeout(() => setSaved(false), 2000);
                },
            },
        );
    };

    return (
        <div className="grid gap-4">
            {gifts.map((gift, i) => (
                <div
                    key={i}
                    className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2"
                >
                    <select
                        value={gift.type}
                        onChange={(e) => update(i, 'type', e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                        <option value="bank">Bank</option>
                        <option value="ewallet">E-Wallet</option>
                    </select>
                    <Input
                        placeholder="Provider (BCA, GoPay, …)"
                        value={gift.provider_name}
                        onChange={(e) =>
                            update(i, 'provider_name', e.target.value)
                        }
                    />
                    <Input
                        placeholder="Nomor Rekening / HP"
                        value={gift.account_number}
                        onChange={(e) =>
                            update(i, 'account_number', e.target.value)
                        }
                    />
                    <Input
                        placeholder="Atas Nama"
                        value={gift.account_name}
                        onChange={(e) =>
                            update(i, 'account_name', e.target.value)
                        }
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="justify-self-start text-destructive"
                        onClick={() => remove(i)}
                    >
                        <Trash2 className="size-4" /> Hapus
                    </Button>
                </div>
            ))}
            <div className="flex gap-2">
                <Button variant="outline" onClick={add}>
                    Tambah Rekening
                </Button>
                <Button onClick={saveGifts}>
                    {saved ? 'Tersimpan ✓' : 'Simpan Angpao'}
                </Button>
            </div>
        </div>
    );
}

function TemplateStep({
    form,
    templates,
}: {
    form: Form;
    templates: InvitationTemplate[];
}) {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {templates.map((template) => {
                const selected = form.data.template_id === template.id;

                return (
                    <button
                        key={template.id}
                        onClick={() => form.setData('template_id', template.id)}
                        className={`overflow-hidden rounded-lg border text-left transition ${
                            selected
                                ? 'border-rose-400 ring-2 ring-rose-300'
                                : 'hover:border-rose-300'
                        }`}
                    >
                        <div className="relative aspect-[3/4] bg-muted">
                            {template.thumbnail && (
                                <img
                                    src={template.thumbnail}
                                    alt={template.name}
                                    className="h-full w-full object-cover"
                                />
                            )}
                            {template.min_package !== 'starter' && (
                                <Badge className="absolute top-2 right-2">
                                    {PACKAGE_LABEL[template.min_package]}+
                                </Badge>
                            )}
                        </div>
                        <div className="p-2">
                            <p className="text-sm font-medium">
                                {template.name}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                                {template.category}
                            </p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

function ReviewStep({
    invitation,
    packages,
    addons,
    midtrans,
    selectedTemplate,
}: {
    invitation: PublicInvitation;
    packages: Package[];
    addons: Addon[];
    midtrans: { client_key: string; is_production: boolean };
    selectedTemplate?: InvitationTemplate;
}) {
    const requiredTier: PackageTier =
        selectedTemplate?.min_package ?? 'starter';
    const requiredRank = PACKAGE_RANK[requiredTier];
    const isEligible = (value: PackageTier) =>
        PACKAGE_RANK[value] >= requiredRank;

    const defaultPackage: Package['value'] =
        invitation.package && isEligible(invitation.package)
            ? invitation.package
            : (packages.find((pkg) => isEligible(pkg.value))?.value ??
              'starter');

    const [selected, setSelected] = useState<Package['value']>(defaultPackage);
    const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleAddon = (value: string) =>
        setSelectedAddons((current) =>
            current.includes(value)
                ? current.filter((v) => v !== value)
                : [...current, value],
        );

    const packagePrice =
        packages.find((pkg) => pkg.value === selected)?.price ?? 0;
    const addonTotal = addons
        .filter((addon) => selectedAddons.includes(addon.value))
        .reduce((sum, addon) => sum + addon.price, 0);
    const grandTotal = packagePrice + addonTotal;

    if (invitation.status === 'active') {
        return (
            <div className="grid gap-4 text-center">
                <p className="text-muted-foreground">
                    Undangan Anda sudah aktif dan dapat diakses melalui tautan
                    publik.
                </p>
                <p className="font-mono text-sm">
                    libradigital.id/undangan/{invitation.slug}
                </p>
                <div className="flex flex-col items-center gap-3">
                    <Badge>Aktif</Badge>
                    <Button asChild variant="outline">
                        <a
                            href={`/undangan/${invitation.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Lihat Undangan
                        </a>
                    </Button>
                </div>
            </div>
        );
    }

    const isPending = invitation.status === 'pending_payment';

    const pay = async () => {
        setProcessing(true);
        setError(null);

        try {
            const response = await postJson<{ snap_token: string }>(
                OrderController.store(invitation.id).url,
                { package: selected, addons: selectedAddons },
            );

            await loadSnap(midtrans.client_key, midtrans.is_production);

            if (!window.snap) {
                throw new Error('Snap belum siap');
            }

            window.snap.pay(response.data.snap_token, {
                // The invitation only flips to "active" once Midtrans calls the
                // billing webhook, so reload to pick up the latest status and
                // always clear the spinner (React keeps this component mounted
                // across an Inertia reload).
                onSuccess: () => {
                    setProcessing(false);
                    router.reload();
                },
                onPending: () => {
                    setProcessing(false);
                    router.reload();
                },
                onError: () => setProcessing(false),
                onClose: () => setProcessing(false),
            });
        } catch {
            setError('Gagal memproses pembayaran. Silakan coba lagi.');
            setProcessing(false);
        }
    };

    return (
        <div className="grid gap-6">
            <div className="text-center">
                {isPending ? (
                    <div className="grid gap-3">
                        <p className="text-muted-foreground">
                            Pembayaran sedang diproses. Undangan akan aktif
                            otomatis setelah pembayaran dikonfirmasi.
                        </p>
                        <Button
                            variant="outline"
                            className="mx-auto"
                            onClick={() => router.reload()}
                        >
                            Perbarui Status
                        </Button>
                    </div>
                ) : (
                    <p className="text-muted-foreground">
                        Pilih paket untuk mengaktifkan undangan Anda.
                    </p>
                )}
                <p className="mt-2 font-mono text-sm">
                    libradigital.id/undangan/{invitation.slug}
                </p>
            </div>

            {requiredTier !== 'starter' && (
                <p className="rounded-lg bg-muted px-4 py-3 text-center text-sm text-muted-foreground">
                    Template{' '}
                    <span className="font-medium text-foreground">
                        {selectedTemplate?.name}
                    </span>{' '}
                    membutuhkan paket minimal{' '}
                    <span className="font-medium text-foreground">
                        {PACKAGE_LABEL[requiredTier]}
                    </span>
                    .
                </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
                {packages.map((pkg) => {
                    const isSelected = selected === pkg.value;
                    const eligible = isEligible(pkg.value);

                    return (
                        <button
                            key={pkg.value}
                            onClick={() => eligible && setSelected(pkg.value)}
                            disabled={!eligible}
                            className={`rounded-xl border p-4 text-left transition ${
                                isSelected
                                    ? 'border-rose-400 ring-2 ring-rose-300'
                                    : eligible
                                      ? 'hover:border-rose-300'
                                      : 'cursor-not-allowed opacity-50'
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-medium">{pkg.label}</span>
                                {isSelected ? (
                                    <Check className="size-4 text-rose-500" />
                                ) : (
                                    !eligible && (
                                        <Lock className="size-4 text-muted-foreground" />
                                    )
                                )}
                            </div>
                            <p className="mt-1 text-lg font-semibold">
                                {formatRupiah(pkg.price)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {pkg.duration_months
                                    ? `Aktif ${pkg.duration_months} bulan`
                                    : 'Aktif selamanya'}
                                {pkg.gallery_limit > 0
                                    ? ` · ${pkg.gallery_limit} foto galeri`
                                    : ''}
                            </p>
                        </button>
                    );
                })}
            </div>

            {addons.length > 0 && (
                <div className="grid gap-2">
                    <p className="text-sm font-medium">Tambahan (opsional)</p>
                    {addons.map((addon) => {
                        const checked = selectedAddons.includes(addon.value);

                        return (
                            <label
                                key={addon.value}
                                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                                    checked
                                        ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20'
                                        : 'hover:border-rose-300'
                                }`}
                            >
                                <Checkbox
                                    checked={checked}
                                    onCheckedChange={() =>
                                        toggleAddon(addon.value)
                                    }
                                    className="mt-0.5"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-medium">
                                            {addon.label}
                                        </span>
                                        <span className="text-sm font-semibold">
                                            {formatRupiah(addon.price)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {addon.description}
                                    </p>
                                </div>
                            </label>
                        );
                    })}
                </div>
            )}

            <div className="flex items-center justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-xl font-semibold">
                    {formatRupiah(grandTotal)}
                </span>
            </div>

            {error && (
                <p className="text-center text-sm text-destructive">{error}</p>
            )}

            <Button onClick={pay} disabled={processing} className="mx-auto">
                {processing && <Loader2 className="size-4 animate-spin" />}
                {isPending ? 'Bayar Ulang' : 'Bayar & Publikasikan'}
            </Button>
        </div>
    );
}

Builder.layout = () => ({
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Builder', href: '#' },
    ],
});
