<?php

namespace App\Models;

use Database\Factories\MeetingTypeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * A call template with a name, an optional description and a duration.
 * Created by the owner and never changed or deleted afterwards.
 *
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property int $duration_minutes
 */
#[Fillable(['name', 'description', 'duration_minutes'])]
class MeetingType extends Model
{
    /** @use HasFactory<MeetingTypeFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'duration_minutes' => 'integer',
        ];
    }
}
