import { Head, router, useForm } from '@inertiajs/react';
import { Check, Loader2, Trash2, Upload } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import InvitationController from '@/actions/App/Http/Controllers/InvitationController';
import UpgradeToPremiumButton from '@/components/billing/UpgradeToPremiumButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { dashboard } from '@/routes';
import type {
    GiftType,
    InvitationTemplate,
    PublicInvitation,
} from '@/types/invitation';

interface Props {
    invitation: PublicInvitation;
    templates: InvitationTemplate[];
    midtrans: {
        client_key: string;
        is_production: boolean;
    };
}

const STEPS = [
    'Mempelai',
    'Lokasi',
    'Foto',
    'Kisah',
    'Angpao',
    'Template',
    'Review',
];

const toLocalInput = (iso: string | null) => (iso ? iso.slice(0, 16) : '');

export default function Builder({ invitation, templates, midtrans }: Props) {
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
                <div className="mb-4 flex items-center justify-between">
                    <Stepper current={step} onStep={goTo} />
                    <UpgradeToPremiumButton
                        clientKey={midtrans.client_key}
                        isProduction={midtrans.is_production}
                    />
                </div>

                <div className="mt-6 rounded-xl border p-6">
                    {step === 0 && <CoupleStep form={form} />}
                    {step === 1 && <VenueStep form={form} />}
                    {step === 2 && <PhotosStep invitation={invitation} />}
                    {step === 3 && <StoryStep form={form} />}
                    {step === 4 && <GiftStep invitation={invitation} />}
                    {step === 5 && (
                        <TemplateStep form={form} templates={templates} />
                    )}
                    {step === 6 && <ReviewStep invitation={invitation} />}
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
                        <Field label="Link Google Maps" name={`maps_url_${kind}`}>
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
                            {template.is_premium && (
                                <Badge className="absolute top-2 right-2">
                                    Premium
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

function ReviewStep({ invitation }: { invitation: PublicInvitation }) {
    const isPublished = invitation.status === 'published';

    const publish = () => {
        router.post(
            InvitationController.publish(invitation.id).url,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    return (
        <div className="grid gap-4 text-center">
            <p className="text-muted-foreground">
                Undangan Anda siap. Setelah dipublikasikan, undangan dapat
                diakses melalui tautan publik.
            </p>
            <p className="font-mono text-sm">
                libradigital.id/undangan/{invitation.slug}
            </p>
            {isPublished ? (
                <div className="flex flex-col items-center gap-3">
                    <Badge>Sudah dipublikasikan</Badge>
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
            ) : (
                <Button onClick={publish} className="mx-auto">
                    Publikasikan Undangan
                </Button>
            )}
        </div>
    );
}

Builder.layout = () => ({
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard.url() },
        { title: 'Builder', href: '#' },
    ],
});
