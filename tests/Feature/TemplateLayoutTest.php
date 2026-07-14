<?php

use App\Models\Template;

it('round-trips a layout node tree through the array cast', function () {
    $layout = [
        'version' => 1,
        'root' => [
            'id' => 'root',
            'type' => 'section',
            'variant' => 'hero',
            'style' => ['align' => 'center'],
            'children' => [
                [
                    'id' => 'hero_names',
                    'type' => 'text',
                    'tag' => 'h1',
                    'value' => ['kind' => 'bind', 'field' => 'groom_name'],
                    'style' => ['font' => 'heading'],
                ],
            ],
        ],
    ];

    $template = Template::factory()->create(['layout' => $layout]);

    $fresh = $template->fresh();

    expect($fresh->layout)->toBeArray()
        ->and($fresh->layout['version'])->toBe(1)
        ->and($fresh->layout['root']['children'][0]['value']['field'])->toBe('groom_name');
});

it('defaults builder_version to 1 and layout to null', function () {
    $template = Template::factory()->create();

    expect($template->fresh()->layout)->toBeNull()
        ->and($template->fresh()->builder_version)->toBe(1);
});
