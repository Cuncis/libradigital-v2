<?php

namespace App\Jobs;

use GdImage;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;

/**
 * Resize an uploaded image and re-encode it as WebP on the media disk, then
 * point the owning model's path/url columns at the optimised file and remove
 * the original. Runs on the queue so uploads return immediately.
 */
class OptimizeImage implements ShouldQueue
{
    use Queueable;

    private const MAX_WIDTH = 1600;

    private const QUALITY = 80;

    public function __construct(
        public Model $model,
        public string $pathColumn = 'path',
        public string $urlColumn = 'photo_url',
    ) {}

    public function handle(): void
    {
        $storage = Storage::disk(config('filesystems.media'));

        $source = $this->model->{$this->pathColumn};

        if (! is_string($source) || $source === '' || ! $storage->exists($source)) {
            return;
        }

        // Already optimised (e.g. a retried job) — nothing to do.
        if (str_ends_with(strtolower($source), '.webp')) {
            return;
        }

        $image = @imagecreatefromstring($storage->get($source));

        if (! $image instanceof GdImage) {
            return;
        }

        $image = $this->resize($image);
        $this->preserveTransparency($image);

        $temp = tempnam(sys_get_temp_dir(), 'webp');
        imagewebp($image, $temp, self::QUALITY);
        imagedestroy($image);

        $target = preg_replace('/\.[^.]+$/', '', $source).'.webp';
        $storage->put($target, (string) file_get_contents($temp));
        @unlink($temp);

        if ($target !== $source) {
            $storage->delete($source);
        }

        $this->model->update([
            $this->pathColumn => $target,
            $this->urlColumn => $storage->url($target),
        ]);
    }

    private function resize(GdImage $image): GdImage
    {
        $width = imagesx($image);

        if ($width <= self::MAX_WIDTH) {
            return $image;
        }

        $height = (int) round(imagesy($image) * (self::MAX_WIDTH / $width));
        $resized = imagescale($image, self::MAX_WIDTH, $height);

        if (! $resized instanceof GdImage) {
            return $image;
        }

        imagedestroy($image);

        return $resized;
    }

    private function preserveTransparency(GdImage $image): void
    {
        imagepalettetotruecolor($image);
        imagealphablending($image, false);
        imagesavealpha($image, true);
    }
}
