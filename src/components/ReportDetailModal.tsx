import { type Report, statusLabels } from "@/data/mockData";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Calendar, Building2, Users, Clock, RefreshCw } from "lucide-react";

interface ReportDetailModalProps {
  report: Report | null;
  open: boolean;
  onClose: () => void;
}

const ReportDetailModal = ({ report, open, onClose }: ReportDetailModalProps) => {
  if (!report) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto z-[2000]">
        <DialogHeader>
          <DialogTitle className="text-lg">{report.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <img src={report.imageUrl} alt={report.title} className="w-full aspect-video object-cover rounded-lg" />

          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={report.status} size="md" />
            <PriorityBadge priority={report.priority} />
            {report.categoryName && <span className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">{report.categoryName}</span>}
            {report.subcategoryName && <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">{report.subcategoryName}</span>}
          </div>

          {report.isRecurrence && (
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-2 flex items-center gap-2 text-xs text-accent">
              <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              <span>Problema reincidente — {report.recurrenceCount}ª ocorrência neste local</span>
            </div>
          )}

          <p className="text-sm text-muted-foreground">{report.description}</p>

          <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground flex items-start gap-2">
            <Users className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>Registro anônimo. A identidade do cidadão que reportou esta ocorrência é protegida pelo sistema.</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0" /><span>{report.neighborhood}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="w-4 h-4 shrink-0" /><span>{report.organizationName ?? "Sem órgão atribuído"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4 shrink-0" /><span>{new Date(report.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4 shrink-0" /><span>{report.validations}/{report.requiredValidations} validações</span>
            </div>
          </div>

          {report.estimatedCompletion && (
            <div className="bg-[hsl(var(--status-execution))]/10 border border-[hsl(var(--status-execution))]/20 rounded-lg p-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[hsl(var(--status-execution))]" />
              <span className="text-sm font-medium">Previsão de conclusão: {new Date(report.estimatedCompletion).toLocaleDateString('pt-BR')}</span>
            </div>
          )}

          {report.rejectionReason && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
              <strong>Motivo da rejeição:</strong> {report.rejectionReason}
            </div>
          )}

          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-semibold mb-3">Histórico de andamento</h4>
            <div className="space-y-3">
              {report.statusHistory.map((entry, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1" />
                    {i < report.statusHistory.length - 1 && <div className="w-px h-full bg-border" />}
                  </div>
                  <div className="pb-3">
                    <div className="font-medium text-foreground">{statusLabels[entry.status]}</div>
                    <div className="text-muted-foreground text-xs">
                      {new Date(entry.date).toLocaleDateString('pt-BR')} às {new Date(entry.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {entry.note && <div className="text-muted-foreground mt-0.5">{entry.note}</div>}
                    {entry.by && <div className="text-xs text-primary font-medium mt-0.5">{entry.by}</div>}
                    {entry.reason && <div className="text-xs text-destructive mt-0.5">Motivo: {entry.reason}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDetailModal;
