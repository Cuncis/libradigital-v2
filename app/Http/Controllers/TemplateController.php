<?php

namespace App\Http\Controllers;

use App\Concerns\RespondsWithJson;
use App\Enums\TemplateCategory;
use App\Http\Resources\TemplateResource;
use App\Models\Template;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TemplateController extends Controller
{
    use RespondsWithJson;

    /**
     * List active templates, optionally filtered by category.
     */
    public function index(Request $request): JsonResponse
    {
        $category = $request->enum('category', TemplateCategory::class);

        $templates = Template::query()
            ->where('is_active', true)
            ->when($category, fn ($query) => $query->where('category', $category))
            ->orderByDesc('is_premium')
            ->get();

        return $this->success(TemplateResource::collection($templates));
    }
}
