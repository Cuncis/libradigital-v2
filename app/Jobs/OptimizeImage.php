<?php

namespace App\Jobs;

use GdImage;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

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

    /**
     * Retry a few times to ride out transient object-storage blips.
     */
    public int $tries = 3;

    /**
     * Kept below the database connection's retry_after (90s) so a slow run is
     * never picked up and processed twice.
     */
    public int $timeout = 60;

    /**
     * If the photo (or invitation) was deleted before this ran, just drop the
     * job instead of failing it — the file it would optimise is already gone.
     */
    public bool $deleteWhenMissingModels = true;

    public function __construct(
        public Model $model,
        public string $pathColumn = 'path',
        public string $urlColumn = 'photo_url',
    ) {}

    /**
     * Escalating backoff between attempts (seconds).
     *
     * @return list<int>
     */
    public function backoff(): array
    {
        return [10, 30, 60];
    }

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

        $temp = tempnam(sys_get_temp_dir(), 'webp');

        try {
            $image = $this->resize($image);
            $this->preserveTransparency($image);

            imagewebp($image, $temp, self::QUALITY);

            $target = preg_replace('/\.[^.]+$/', '', $source).'.webp';
            $storage->put($target, (string) file_get_contents($temp));

            if ($target !== $source) {
                $storage->delete($source);
            }

            $this->model->update([
                $this->pathColumn => $target,
                $this->urlColumn => $storage->url($target),
            ]);
        } finally {
            imagedestroy($image);
            @unlink($temp);
        }
    }

    /**
     * The image is left untouched (original file + columns unchanged) so a
     * later retry or manual reprocess can still optimise it.
     */
    public function failed(Throwable $exception): void
    {
        Log::warning('OptimizeImage failed', [
            'model' => $this->model::class,
            'model_id' => $this->model->getKey(),
            'exception' => $exception->getMessage(),
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
