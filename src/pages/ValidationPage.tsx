import { useMemo } from "react";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listValidationRequests, submitValidation, type ValidationDecision } from "@/lib/validations-api";
import { Clock, MapPin, CheckCircle2, XCircle, Users, HelpCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/api";

const ValidationPage = () => {
  const qc = useQueryClient();
  const invitesQ = useQuery({
    queryKey: ["validations", "awaiting-occurrences"],
    queryFn: listValidationRequests,
    retry: 1,
  });

  const invites = useMemo(() => invitesQ.data ?? [], [invitesQ.data]);

  const decideMut = useMutation({
    mutationFn: ({ inviteId, decision }: { inviteId: string; decision: ValidationDecision }) =>
      submitValidation(inviteId, decision),
    onSuccess: (_d, vars) => {
      const messages: Record<ValidationDecision, { title: string; description: string }> = {
        confirm: { title: "Validação confirmada", description: "Obrigado pela confirmação!" },
        reject: { title: "Validação rejeitada", description: "A ocorrência será reavaliada." },
        unknown: { title: "Resposta registrada", description: "Outro cidadão será selecionado para validar." },
      };
      toast(messages[vars.decision]);
      qc.invalidateQueries({ queryKey: ["validations", "awaiting-occurrences"] });
      qc.invalidateQueries({ queryKey: ["occurrences"] });
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : "Não foi possível registrar sua resposta.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    },
  });

  const handleValidate = (inviteId: string, decision: ValidationDecision) =>
    decideMut.mutate({ inviteId, decision });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Validações Pendentes</h1>
          <p className="text-sm text-muted-foreground">Confirme ou rejeite as ocorrências abaixo. Sua participação garante a qualidade da plataforma.</p>
        </div>

        {invitesQ.isLoading ? (
          <div className="text-center py-16 text-muted-foreground">
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin opacity-70" />
            <p>Carregando validações...</p>
          </div>
        ) : invites.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg font-medium">Nenhuma validação pendente</p>
            <p className="text-sm">Você será notificado quando houver novas solicitações.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invites.map(v => {
              const deadline = new Date(v.deadline);
              const now = new Date();
              const hoursLeft = Math.max(0, Math.round((deadline.getTime() - now.getTime()) / 3600000));
              const busy = decideMut.isPending && decideMut.variables?.inviteId === v.id;

              return (
                <Card key={v.id}>
                  <CardContent className="p-4 md:p-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        {v.reportImageUrl && (
                          <img src={v.reportImageUrl} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" loading="lazy" />
                        )}
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              v.type === 'existence' ? 'bg-[hsl(var(--status-awaiting))]/20 text-[hsl(var(--status-awaiting))]' : 'bg-[hsl(var(--status-resolved))]/20 text-[hsl(var(--status-validated))]'
                            }`}>
                              {v.type === 'existence' ? '🔍 Validar Existência' : '✅ Validar Resolução'}
                            </span>
                          </div>
                          <h3 className="text-base font-semibold text-foreground">{v.reportTitle}</h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{v.neighborhood}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {hoursLeft > 0 ? `${hoursLeft}h restantes` : 'Prazo expirado'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                        {v.type === 'existence'
                          ? 'Você foi selecionado para confirmar se este problema realmente existe no local indicado. Visite o local se possível.'
                          : 'O órgão responsável marcou esta ocorrência como resolvida. Confirme se o problema foi realmente solucionado.'}
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <Button onClick={() => handleValidate(v.id, 'confirm')} disabled={busy} className="flex-1 gap-2 bg-[hsl(var(--status-validated))] hover:bg-[hsl(var(--status-validated))]/90">
                          <CheckCircle2 className="w-4 h-4" /> Confirmar
                        </Button>
                        <Button onClick={() => handleValidate(v.id, 'reject')} disabled={busy} variant="outline" className="flex-1 gap-2 border-destructive text-destructive hover:bg-destructive/10">
                          <XCircle className="w-4 h-4" /> Rejeitar
                        </Button>
                        <Button onClick={() => handleValidate(v.id, 'unknown')} disabled={busy} variant="ghost" className="gap-2 text-muted-foreground">
                          <HelpCircle className="w-4 h-4" /> Não sei
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationPage;
