<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RestrictCashierAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $isCashier = $user && (
            $user->role === 'cashier'
            || (is_string($user->email) && strcasecmp($user->email, 'cashier@bethelhub.com') === 0)
        );

        if (!$isCashier) {
            return $next($request);
        }

        $allowed = $request->is('pcs*')
            || $request->is('sessions*')
            || $request->is('pos*')
            || $request->is('logout');

        if ($allowed) {
            return $next($request);
        }

        return redirect('/pcs');
    }
}
