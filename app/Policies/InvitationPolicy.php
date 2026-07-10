<?php

namespace App\Policies;

use App\Models\Invitation;
use App\Models\User;

class InvitationPolicy
{
    /**
     * Only the owner may view or manage an invitation.
     */
    public function view(User $user, Invitation $invitation): bool
    {
        return $this->owns($user, $invitation);
    }

    public function update(User $user, Invitation $invitation): bool
    {
        return $this->owns($user, $invitation);
    }

    public function delete(User $user, Invitation $invitation): bool
    {
        return $this->owns($user, $invitation);
    }

    private function owns(User $user, Invitation $invitation): bool
    {
        return $invitation->user_id === $user->id;
    }
}
