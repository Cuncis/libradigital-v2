<?php

namespace App\Concerns;

use Illuminate\Http\JsonResponse;

trait RespondsWithJson
{
    /**
     * Consistent success envelope: {success, data, message}.
     */
    protected function success(mixed $data = null, string $message = '', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => $message,
        ], $status);
    }
}
