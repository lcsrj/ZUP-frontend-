import { type ReportStatus, statusLabels } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Clock, Wrench, CheckCircle2, CheckCheck, XCircle, Hourglass, Archive, FileEdit } from "lucide-react";

const statusConfig: Record<ReportStatus, { class: string; icon: React.ElementType }> = {
  pre_publicacao: { class: 'status-badge-archived', icon: FileEdit },
  aguardando_validacao: { class: 'status-badge-awaiting', icon: Hourglass },
  em_analise: { class: 'status-badge-analysis', icon: Clock },
  em_execucao: { class: 'status-badge-execution', icon: Wrench },
  resolvido: { class: 'status-badge-resolved', icon: CheckCircle2 },
  resolucao_validada: { class: 'status-badge-validated', icon: CheckCheck },
  resolucao_rejeitada: { class: 'status-badge-rejected', icon: XCircle },
  arquivado: { class: 'status-badge-archived', icon: Archive },
};

interface StatusBadgeProps {
  status: ReportStatus;
  size?: 'sm' | 'md';
  className?: string;
}

const StatusBadge = ({ status, size = 'sm', className }: StatusBadgeProps) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full font-semibold",
      size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      config.class,
      className
    )}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      {statusLabels[status]}
    </span>
  );
};

export default StatusBadge;
