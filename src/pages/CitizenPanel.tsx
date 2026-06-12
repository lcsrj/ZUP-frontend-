import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import StatusBadge from "@/components/StatusBadge";
import PriorityBadge from "@/components/PriorityBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { listValidationRequests } from "@/lib/validations-api";
import { useOccurrences } from "@/hooks/useOccurrences";
import { MapPin, Clock, Bell, CheckCircle2, FileText, Users, Info, Plus, Trash2, AlertCircle, XCircle, HelpCircle } from "lucide-react";
import { formatCEP, validateCEP } from "@/lib/validators";
import { toast } from "@/hooks/use-toast";

interface DeclaredArea {
  cep: string;
  type: string;
}

const CitizenPanel = () => {
  const { user } = useAuth();
  const { reports } = useOccurrences();
  const myReports = useMemo(
    () => (user ? reports.filter(r => r.authorId === String(user.id)) : []),
    [reports, user]
  );
  const invitesQ = useQuery({ queryKey: ["validations", "awaiting-occurrences"], queryFn: listValidationRequests, retry: 1 });
  const myValidations = invitesQ.data ?? [];
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "validations" ? "validations" : "reports";
  const [areas, setAreas] = useState<DeclaredArea[]>([]);
  const [showAreaForm, setShowAreaForm] = useState(false);

  const profileStatus = areas.length > 0 ? 'complete' : 'incomplete';

  const addArea = () => {
    if (areas.length < 2) setAreas([...areas, { cep: '', type: 'moradia' }]);
  };

  const updateArea = (i: number, field: keyof DeclaredArea, value: string) => {
    const updated = [...areas];
    updated[i] = { ...updated[i], [field]: field === 'cep' ? formatCEP(value) : value };
    setAreas(updated);
  };

  const removeArea = (i: number) => setAreas(areas.filter((_, idx) => idx !== i));

  const saveAreas = () => {
    const allValid = areas.every(a => validateCEP(a.cep));
    if (!allValid) {
      toast({ title: 'CEP inválido', description: 'Verifique os CEPs informados.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Perfil territorial salvo!', description: 'Agora você pode registrar ocorrências no mapa de Videira.' });
    setShowAreaForm(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Meu Painel</h1>
          <p className="text-muted-foreground text-sm">Acompanhe suas ocorrências, validações e participação em Videira/SC</p>
        </div>

        {profileStatus === 'incomplete' && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Complete seu perfil territorial</p>
                <p className="text-xs text-muted-foreground mt-1">Para registrar ocorrências no mapa, declare ao menos uma localidade (moradia, trabalho ou estudo) com CEP.</p>
                <Button size="sm" className="mt-2" onClick={() => { setShowAreaForm(true); if (areas.length === 0) addArea(); }}>
                  Completar agora
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {showAreaForm && (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Localidades declaradas</Label>
                {areas.length < 2 && (
                  <Button type="button" variant="ghost" size="sm" onClick={addArea} className="gap-1 text-primary">
                    <Plus className="w-3 h-3" /> Adicionar
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground flex items-start gap-1">
                <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                Declare até 2 localidades. Seus dados de CEP são privados.
              </p>
              {areas.map((area, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input value={area.cep} onChange={e => updateArea(i, 'cep', e.target.value)} placeholder="CEP" maxLength={9} />
                  </div>
                  <Select value={area.type} onValueChange={v => updateArea(i, 'type', v)}>
                    <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moradia">Moradia</SelectItem>
                      <SelectItem value="trabalho">Trabalho</SelectItem>
                      <SelectItem value="estudo">Estudo</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="ghost" size="icon" aria-label="Remover localidade" onClick={() => removeArea(i)} className="text-muted-foreground shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Button size="sm" onClick={saveAreas}>Salvar</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowAreaForm(false)}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Minhas Ocorrências', value: myReports.length, icon: FileText },
            { label: 'Validações Pendentes', value: myValidations.length, icon: Users },
            { label: 'Resolvidas', value: myReports.filter(r => ['resolvido','resolucao_validada'].includes(r.status)).length, icon: CheckCircle2 },
            { label: 'Notificações', value: 0, icon: Bell },
          ].map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className="w-8 h-8 text-primary opacity-70" />
                <div>
                  <div className="text-2xl font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue={initialTab} onValueChange={(v) => setSearchParams(v === "reports" ? {} : { tab: v })}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="reports">Minhas Ocorrências</TabsTrigger>
            <TabsTrigger value="validations" className="gap-1.5">
              Validações
              {myValidations.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
                  {myValidations.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-3 mt-4">
            {myReports.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Você ainda não registrou ocorrências.</CardContent></Card>
            ) : myReports.map(report => (
                <Card key={report.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3 flex-1">
                        <img src={report.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0" loading="lazy" />
                        <div className="space-y-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-sm">{report.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3" />{report.neighborhood}
                            <span>·</span>{report.categoryName && <span>{report.categoryName}</span>}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />{new Date(report.createdAt).toLocaleDateString('pt-BR')}
                            <span>·</span><span>{report.organizationName ?? "Sem órgão atribuído"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 items-end shrink-0">
                        <StatusBadge status={report.status} />
                        <PriorityBadge priority={report.priority} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
            ))}
          </TabsContent>

          <TabsContent value="validations" className="space-y-3 mt-4">
            {myValidations.map(v => {
              const deadline = new Date(v.deadline);
              const now = new Date();
              const hoursLeft = Math.max(0, Math.round((deadline.getTime() - now.getTime()) / 3600000));
              return (
                <Card key={v.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <img src={v.reportImageUrl} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" loading="lazy" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-foreground text-sm">{v.reportTitle}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.type === 'existence' ? 'bg-[hsl(var(--status-awaiting))]/20 text-[hsl(var(--status-awaiting))]' : 'bg-[hsl(var(--status-resolved))]/20 text-[hsl(var(--status-validated))]'}`}>
                            {v.type === 'existence' ? 'Existência' : 'Resolução'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />{v.neighborhood}
                          <Clock className="w-3 h-3 ml-1" />{hoursLeft}h restantes
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" className="gap-1 bg-[hsl(var(--status-validated))] hover:bg-[hsl(var(--status-validated))]/90" onClick={() => toast({ title: 'Confirmado!' })}>
                            <CheckCircle2 className="w-3 h-3" /> Confirmar
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1 border-destructive text-destructive" onClick={() => toast({ title: 'Rejeitado' })}>
                            <XCircle className="w-3 h-3" /> Rejeitar
                          </Button>
                          <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground" onClick={() => toast({ title: 'Registrado' })}>
                            <HelpCircle className="w-3 h-3" /> Não sei
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Histórico de participação disponível quando o backend expuser /users/me/activity.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-3 mt-4">
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Você não possui notificações.
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CitizenPanel;
