import { Link } from "@tanstack/react-router";

type MenuUser = {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
  serverCount: number;
};

/** Avatar + name dropdown. The Admin Panel entry is only rendered for server-verified admins. */
export function AccountMenu({ user, isAdmin }: { user: MenuUser; isAdmin: boolean }) {
  const name = user.globalName ?? user.username;
  const avatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`
    : null;
  return (
    <details className="group relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-border bg-surface px-2 py-1.5 transition hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
        {avatar ? (
          <img src={avatar} alt="" className="size-6 rounded-full" />
        ) : (
          <span className="grid size-6 place-items-center rounded-full bg-secondary text-[11px]">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="hidden max-w-[110px] truncate text-sm sm:inline">{name}</span>
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
        <div className="border-b border-border px-4 py-3">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">
            {user.serverCount} manageable server{user.serverCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-col p-1.5 text-sm">
          <Link to="/dashboard" className="rounded px-3 py-2 hover:bg-surface-2">
            Dashboard
          </Link>
          <Link to="/dashboard/servers" className="rounded px-3 py-2 hover:bg-surface-2">
            My Servers
          </Link>
          {isAdmin ? (
            <Link to="/admin" className="rounded px-3 py-2 text-primary hover:bg-surface-2">
              Admin Panel
            </Link>
          ) : null}
          <a
            href="/api/public/auth/logout"
            className="rounded px-3 py-2 text-muted-foreground hover:bg-surface-2"
          >
            Logout
          </a>
        </div>
      </div>
    </details>
  );
}
