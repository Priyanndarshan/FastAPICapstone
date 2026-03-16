export interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    badge?: React.ReactNode;
}

export default function PageHeader({ title, description, actions, badge }: PageHeaderProps) {
    return (
        <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
                {description != null && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
                {badge != null && <div className="mt-4 flex flex-wrap items-center gap-3">{badge}</div>}
            </div>
            {actions != null && <div className="flex items-center gap-3">{actions}</div>}
        </header>
    );
}
